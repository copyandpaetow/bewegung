import { BidirectionalMap, getOrAddKeyFromLookup } from "./element-translations";
import { setObserver } from "./observe-dom";
import { createMachine } from "./state-machine";
import {
	AllPlayStates,
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
	const { timeline, timekeeper, worker } = context;

	const callbacksOnly = new Map<number, Set<VoidFunction>>();
	const easingsOnly = new Map<number, Set<string>>();
	timeline.forEach((entry) => {
		const { callbacks, end, easings } = entry;
		callbacksOnly.set(end, callbacks);
		easingsOnly.set(end, easings);
	});

	worker("easings").reply("sendEasings", easingsOnly);

	return {
		changes: callbacksOnly.entries(),
		animations: [timekeeper],
	};
};

const getDecendents = (element: HTMLElement) =>
	Array.from(element.querySelectorAll("*")) as HTMLElement[];

const setElementRelatedState = (rootElements: Set<ElementOrSelector>): ElementRelatedState => {
	const parents = new Map<HTMLElement, HTMLElement>();
	const sibilings = new Map<HTMLElement, HTMLElement | null>();
	const elementResets = new Map<HTMLElement, Map<string, string>>();
	const translations = new BidirectionalMap<string, HTMLElement>();

	const allElements = new Set(Array.from(rootElements).map(getElement).flatMap(getDecendents));

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
	const { rootElements, timekeeper, worker } = context;

	let nextPlayState = "play";
	let time = Date.now();

	let elementState: null | ElementRelatedState = null;
	let dimensionState: null | DimensionState = null;
	let observer: null | MutationObserver = null;

	const resetState = () => {
		elementState ??= setElementRelatedState(rootElements);
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
					console.log({ nextPlayState });
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
				console.log(`calculation took ${Date.now() - time}ms`);

				dimensionState?.animations.forEach((animation) => animation.play());
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
			isAnimationWanted() {
				return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === false;
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
				guard: [
					{ condition: "isStateLoaded", altTarget: "loading" },
					{ condition: "isAnimationWanted", altTarget: "finished" },
				],
				entry: "playAnimations",
				on: {
					pause: {
						target: "paused",
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
				guard: [
					{ condition: "isStateLoaded", altTarget: "loading" },
					{ condition: "isAnimationWanted", altTarget: "finished" },
				],
				entry: "scrollAnimations",
				on: {
					pause: {
						target: "paused",
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
