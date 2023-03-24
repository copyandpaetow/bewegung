import { BidirectionalMap, getOrAddKeyFromLookup } from "./element-translations";
import { setObserver } from "./observe-dom";
import { createMachine } from "./state-machine";
import {
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

export const getAnimationStateMachine = (context: Context) => {
	const { userInput, timekeeper, worker } = context;

	let nextPlayState = "play";

	let elementState: null | ElementRelatedState = null;
	let dimensionState: null | DimensionState = null;
	let observer: null | MutationObserver = null;

	const resetState = () => {
		elementState ??= setElementRelatedState(userInput);
		dimensionState ??= setDimensionRelatedState(context);
		observer = setObserver(elementState, dimensionState, context);
	};

	const machine = createMachine({
		initialState: "idle",
		actions: {
			loadState() {
				resetState();
				const { onError, onMessage, cleanup } = worker("animations");
				onMessage(() => {
					machine.transition(nextPlayState);
					cleanup();
				});
				onError(() => {
					machine.transition("cancel");
					cleanup();
				});
			},
			setFinishTransitionOnTimekeeper() {
				timekeeper.onfinish = () => machine.transition("finish");
			},
			setNextStateAfterLoadingToPlay() {
				nextPlayState = "play";
			},
			setNextStateAfterLoadingToScroll() {
				nextPlayState = "scroll";
			},
			playAnimations() {
				console.log("play");
			},
			scrollAnimations() {
				console.log("scroll");
			},
			enableReactivity() {
				console.log("enableReactivity");
			},
			disableReactivity() {
				console.log("disableReactivity");
			},
			finishAnimation() {
				console.log("finishAnimation");
			},
			cleanup() {
				console.log("cleanup");
			},
			resetElements() {
				console.log("resetElements");
			},
		},
		guards: {
			isStateLoaded() {
				return [elementState, dimensionState].every(Boolean);
			},
		},
		states: {
			idle: {
				on: {
					play: {
						target: "playing",
						action: "setNextStateAfterLoadingToPlay",
					},
					scroll: {
						target: "scrolling",
						action: "setNextStateAfterLoadingToScroll",
					},
					finish: {
						target: "finished",
					},
				},
				exit: "setFinishTransitionOnTimekeeper",
			},
			loading: {
				entry: "loadState",
				on: {
					play: {
						target: "playing",
					},
					scroll: {
						target: "scrolling",
					},
					cancel: {
						target: "canceled",
					},
				},
			},
			playing: {
				guard: [{ condition: "isStateLoaded", altTarget: "loading" }],
				entry: "playAnimations",
				on: {
					pause: {
						target: "pausing",
					},
					scroll: {
						target: "scrolling",
					},
					cancel: {
						target: "canceled",
					},
					finish: {
						target: "finished",
					},
				},
			},
			scrolling: {
				guard: [{ condition: "isStateLoaded", altTarget: "loading" }],
				entry: "scrollAnimations",
				on: {
					pause: {
						target: "pausing",
					},
					play: {
						target: "playing",
					},
					cancel: {
						target: "canceled",
					},
					finish: {
						target: "finished",
					},
				},
			},
			paused: {
				on: {
					play: {
						target: "playing",
					},
					scroll: {
						target: "scrolling",
					},
					cancel: {
						target: "canceled",
					},
					finish: {
						target: "finished",
					},
				},
				entry: "enableReactivity",
				exit: "disableReactivity",
			},
			finished: {
				on: {},
				entry: ["finishAnimation", "cleanup"],
			},
			canceled: {
				on: {},
				entry: ["resetElements", "cleanup"],
			},
		},
	});

	return machine;
};
