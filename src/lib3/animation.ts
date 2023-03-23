import { BidirectionalMap, getOrAddKeyFromLookup } from "./element-translations";
import { createMachine } from "./state-machine";
import {
	AtomicWorker,
	BewegungsOptions,
	Context,
	DimensionState,
	ElementOrSelector,
	ElementRelatedState,
} from "./types";

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

const setDimensionRelatedState = (context: Context): DimensionState => {
	const { timeline, timekeeper } = context;

	return {
		changes: timeline.values(),
		animations: [timekeeper],
	};
};

const setElementRelatedState = (userInput: BewegungsOptions[]): ElementRelatedState => {
	const parents = new Map<HTMLElement, HTMLElement>();
	const sibilings = new Map<HTMLElement, HTMLElement | null>();
	const elementResets = new Map<HTMLElement, Map<string, string>>();
	const translations = new BidirectionalMap<string, HTMLElement>();

	const allElements = new Set(
		userInput.flatMap(
			(entry) => Array.from(getElement(entry[1].root).querySelectorAll("*")) as HTMLElement[]
		)
	);

	allElements.forEach((element) => {
		parents.set(element, element.parentElement!);
		sibilings.set(element, element.nextElementSibling as HTMLElement | null);
		elementResets.set(element, saveOriginalStyle(element));
		getOrAddKeyFromLookup(element, translations);
	});

	return {
		parents,
		sibilings,
		elementResets,
		translations,
	};
};

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
	});

const saveElementDimensions = (elementState: ElementRelatedState, worker: AtomicWorker) => {
	const { translations } = elementState;

	const currentChange = new Map<string, DOMRect>();

	translations.forEach((domElement, elementString) => {
		//TODO: we might need more information like from window.getComputedStyle
		currentChange.set(elementString, domElement.getBoundingClientRect());
	});

	//TODO: we need to know if this is the last change or not via a done property
	worker("domChanges").reply("sendDOMRects", currentChange);
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

export const setObserver = (
	elementState: ElementRelatedState,
	dimensionState: DimensionState,
	context: Context
) => {
	let currentChange = dimensionState.changes.next();
	let wasCallbackCalled = true;
	//TODO: this we only need conditionally, if not change is that the element should start on/from
	saveElementDimensions(elementState, context.worker);

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		wasCallbackCalled = true;
		saveElementDimensions(elementState, context.worker);

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, elementState.elementResets);
					break;

				case "childList":
					resetElements(entry, elementState);
					break;

				case "characterData":
					//TODO: how to handle this?
					break;

				default:
					break;
			}
		});

		currentChange = dimensionState.changes.next();

		console.log("observer done?", currentChange.done);

		if (currentChange.done) {
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

export const getAnimationStateMachine = (context: Context) => {
	const { userInput, timekeeper, worker } = context;

	let time = 0;

	let elementState: null | ElementRelatedState = null;
	let dimensionState: null | DimensionState = null;
	let observer: null | MutationObserver = null;

	const resetState = () => {
		elementState ??= setElementRelatedState(userInput);
		dimensionState ??= setDimensionRelatedState(context);
		observer ??= setObserver(elementState!, dimensionState!, context);
		console.log({ ...context, ...elementState });
	};

	//TODO: scoll is missing => we might need a payload for where to go after successful load
	const machine = createMachine("idle", {
		idle: {
			actions: {
				onExit() {
					timekeeper.onfinish = () => machine.transition("finish");
					time = Date.now();
				},
			},
			transitions: {
				load: {
					target: "loading",
				},
			},
		},
		loading: {
			actions: {
				onEnter() {
					resetState();
					const { onError, onMessage } = worker("animations");
					onMessage(() => {
						machine.transition("play");
					});
					onError(() => {
						machine.transition("cancel");
					});
				},
				onExit() {
					console.log(`calulation took ${Date.now() - time}ms`);
				},
			},
			transitions: {
				play: {
					target: "playing",
				},
				cancel: {
					target: "canceled",
				},
			},
		},
		playing: {
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
				onEnter() {
					//TODO: setup reactivity
				},
			},
			transitions: {
				play: {
					target: "loading",
					action() {
						//TODO: disable reactivity
					},
				},
			},
		},
		finished: {
			actions: {
				onEnter() {
					//TODO: cleanup here
				},
			},
			transitions: {},
		},
		canceled: {
			actions: {
				onEnter() {
					//TODO: cleanup here
				},
			},
			transitions: {},
		},
	});

	return machine;
};
