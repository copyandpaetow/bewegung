import { createAnimations } from "./create-animations";
import { getOrAddKeyFromLookup } from "./element-translations";
import { setObserver } from "./observe-dom";
import { createMachine } from "./state-machine";
import { MainState, NormalizedOptions } from "./types";

export const saveOriginalStyle = (element: HTMLElement) => {
	const attributes = new Map<string, string>();

	element.getAttributeNames().forEach((attribute) => {
		attributes.set(attribute, element.getAttribute(attribute)!);
	});
	if (!attributes.has("style")) {
		attributes.set("style", element.style.cssText);
	}

	return attributes;
};

const getDecendents = (element: HTMLElement) =>
	Array.from(element.querySelectorAll("*")) as HTMLElement[];

const isTextNode = (element: HTMLElement) => {
	if (!element.hasChildNodes()) {
		return;
	}

	//TODO: investigate if node.nodeType === 3 is faster
	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()));
};

export const addElementToStates = (
	options: Set<NormalizedOptions>,
	element: HTMLElement,
	state: MainState
) => {
	const { elementResets, siblings, easings, ratios, types, parents, elementTranslations } = state;
	const key = getOrAddKeyFromLookup(element, elementTranslations);
	const siblingKey = element.nextElementSibling
		? getOrAddKeyFromLookup(element.nextElementSibling as HTMLElement, elementTranslations)
		: null;
	elementResets.set(key, saveOriginalStyle(element));

	siblings.set(key, siblingKey);
	parents.set(key, getOrAddKeyFromLookup(element.parentElement!, elementTranslations));
	easings.set(
		key,
		new Set(
			Array.from(options, (option) => {
				const { start, end, easing } = option;
				return {
					start,
					end,
					easing,
				};
			})
		)
	);
	if (element.tagName === "IMG") {
		ratios.set(
			key,
			(element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight
		);
	}
	if (isTextNode(element)) {
		types.add(key);
	}
};

const setElementRelatedState = (state: MainState) => {
	const {
		options,
		elementTranslations,
		worker,
		elementResets,
		parents,
		easings,
		ratios,
		types,
		siblings,
	} = state;
	const elementRelations = new Map<HTMLElement, Set<NormalizedOptions>>();

	options.forEach((option) => {
		const rootElement = elementTranslations.get(option.root)!;
		getDecendents(rootElement).forEach((element) => {
			elementRelations.set(element, (elementRelations.get(element) ?? new Set()).add(option));
		});
		elementResets.set(option.root, saveOriginalStyle(rootElement));
		parents.set(option.root, option.root);
		siblings.set(option.root, null);
		easings.set(
			option.root,
			new Set([{ start: option.start, end: option.end, easing: option.easing }])
		);
	});

	elementRelations.forEach((ids, element) => {
		addElementToStates(ids, element, state);
	});

	worker("state").reply("sendState", {
		parents,
		easings,
		ratios,
		types,
	});

	return true;
};

export const getAnimationStateMachine = (state: MainState) => {
	const { timekeeper, worker } = state;

	let nextPlayState = "play";
	let time = Date.now();

	//TODO: this needs to be better
	let elementsStillValid = false;
	let observer: null | MutationObserver = null;

	const resetState = () => {
		if (!elementsStillValid) {
			elementsStillValid = true;
			setElementRelatedState(state);
			observer?.disconnect();
			observer = null;
		}
		observer ??= setObserver(state);
	};

	const machine = createMachine({
		initialState: "idle",
		actions: {
			loadState() {
				resetState();
				const { onError, onMessage, cleanup } = worker("results");
				onMessage((ResultTransferable) => {
					createAnimations(ResultTransferable, state);
					state.onStart.forEach((cb) => cb());
					//TODO: this can be done better
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

				state.animations.forEach((animation) => {
					animation.play();
					animation.pause();
				});
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
			finishAnimations() {
				console.log("finishAnimations");
				state.resolve(undefined);
			},
			cancelAnimations() {
				console.log("cancelAnimations");
				state.reject("user cancel");
			},
			cleanup() {
				console.log("cleanup");
				observer?.disconnect();
			},
			resetElements() {
				console.log("resetElements");
			},
		},
		guards: {
			isStateLoaded() {
				return [elementsStillValid, observer].every(Boolean);
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
				entry: ["finishAnimations", "cleanup"],
			},
			canceled: {
				on: {},
				entry: ["cancelAnimations", "resetElements", "cleanup"],
			},
		},
	});

	return machine;
};
