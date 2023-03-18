import { createMachine } from "./state-machine";
import { BewegungsOptions, DimensionState, ElementOrSelector, ElementRelatedState } from "./types";

/*
- we need to store the current element state with attributes and cssText / CSSStyleDeclaration
- we also need to store the dimensions/styles and the parents and previous siblings
- we would need to create a sort of list which function will be called according to their order (even multiple times when they got iterations)
- we would need to register the MO early

- if we do the calculations in a webworker, we need to translate the elements into something transferable again

- maybe we can directly start everything as a stateMachine from the beginning=?

- maybe we should start the animation directly but still allow to pause/unpause




*/

const setTimekeeper = (totalRuntime: number, callback: VoidFunction) => {
	let time = Date.now();
	const animation = new Animation(new KeyframeEffect(null, null, totalRuntime));
	animation.onfinish = () => {
		console.log(`it took ${Date.now() - time}ms`);
		callback();
	};

	return animation;
};

const getElement = (element: ElementOrSelector) => {
	if (typeof element !== "string") {
		return element as HTMLElement;
	}
	return document.querySelector(element) as HTMLElement;
};

const saveOriginalStyle = (element: HTMLElement) => {
	const attributes = new Map<string, string>();

	element.getAttributeNames().forEach((attribute) => {
		attributes.set(attribute, element.getAttribute(attribute)!);
	});
	if (!attributes.has("style")) {
		attributes.set("style", element.style.cssText);
	}

	return attributes;
};

const setElementRelatedState = (props: BewegungsOptions[]): ElementRelatedState => {
	const parents = new Map<HTMLElement, HTMLElement>();
	const sibilings = new Map<HTMLElement, HTMLElement | null>();
	const elementResets = new Map<HTMLElement, Map<string, string>>();

	props.forEach((entry) => {
		const { root } = entry[1];

		const rootElement = getElement(root);
		const allElements = Array.from(rootElement.querySelectorAll("*")) as HTMLElement[];

		allElements.forEach((element) => {
			parents.set(element, element.parentElement!);
			sibilings.set(element, element.nextElementSibling as HTMLElement | null);
			elementResets.set(element, saveOriginalStyle(element));
		});
	});

	return {
		parents,
		sibilings,
		elementResets,
	};
};

const setDimensionState = (
	state: ElementRelatedState,
	timeline: Map<number, Set<VoidFunction>>
): DimensionState => {
	const dimensions = new Map<HTMLElement, DOMRect[]>();
	const changes = timeline.values();

	Array.from(state.elementResets.keys(), (element) => dimensions.set(element, []));

	return {
		dimensions,
		changes,
	};
};

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
	});

const saveElementDimensions = (dimensionState: Map<HTMLElement, DOMRect[]>) => {
	dimensionState.forEach((domRects, element) => {
		domRects.push(element.getBoundingClientRect());
	});
};

const resetStyle = (entry: MutationRecord, saveMap: Map<HTMLElement, Map<string, string>>) => {
	const target = entry.target as HTMLElement;
	const savedAttributes = saveMap.get(target)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

const resetElements = (entry: MutationRecord, elementState: ElementRelatedState) => {
	const { parents, sibilings } = elementState;
	const [target] = entry.removedNodes;

	const parentElement = parents.get(target as HTMLElement)!;
	const nextSibiling = sibilings.get(target as HTMLElement)!;

	parentElement.insertBefore(target, nextSibiling);
};

export const setObserver = (elementState: ElementRelatedState, dimensionState: DimensionState) => {
	const { dimensions, changes } = dimensionState;
	let currentChange = changes.next();
	let wasCallbackCalled = true;
	//TODO: this we only need conditionally, if not change is that the element should start on/from
	saveElementDimensions(dimensions);

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		wasCallbackCalled = true;
		console.log("observer start");
		saveElementDimensions(dimensions);

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, elementState.elementResets);
					break;

				case "childList":
					resetElements(entry, elementState);
					break;

				default:
					break;
			}
		});

		currentChange = changes.next();

		console.log("observer done?", currentChange.done);

		if (currentChange.done) {
			console.log(dimensions);
			return;
		}

		observe(observer);
		requestAnimationFrame(() => {
			wasCallbackCalled = false;
			currentChange.value.forEach((callback) => {
				callback();
			});
			requestAnimationFrame(() => {
				if (wasCallbackCalled) {
					return;
				}
				observerCallback([], observer);
			});
		});
	};

	const observer = new MutationObserver(observerCallback);
	observe(observer);

	requestAnimationFrame(() => currentChange.value.forEach((callback) => callback()));

	return observer;
};

export const getAnimationStateMachine = (
	props: BewegungsOptions[],
	totalRuntime: number,
	timeline: Map<number, Set<VoidFunction>>
) => {
	let elementState: null | ElementRelatedState = null;
	let dimensionState: null | DimensionState = null;
	let timeKeeper: null | Animation = null;
	let observer: null | MutationObserver = null;

	console.log({ timeline });

	const resetState = () => {
		elementState ??= setElementRelatedState(props);
		dimensionState ??= setDimensionState(elementState, timeline);
		timeKeeper ??= setTimekeeper(totalRuntime, () => machine.transition("finished"));
	};

	resetState();

	const machine = createMachine("idle", {
		idle: {
			transitions: {
				play: {
					target: "playing",
				},
			},
		},
		playing: {
			actions: {
				async onEnter() {
					// setup states if they dont exist
					resetState();
					observer ??= setObserver(elementState!, dimensionState!);
				},
			},
			transitions: {
				pause: {
					target: "paused",
				},
				finish: {
					target: "finished",
				},
			},
		},
		paused: {
			actions: {
				async onEnter() {
					//setup reactivity
				},
			},
			transitions: {
				play: {
					target: "playing",
					async action() {
						//disable reactivity
					},
				},
			},
		},
		finished: {
			actions: {
				async onEnter() {},
			},
			transitions: {},
		},
	});

	return machine;
};
