import { getOrAddKeyFromLookup } from "./element-translations";
import { setObserver } from "./observe-dom";
import { createMachine } from "./state-machine";
import { Context, DimensionState, ElementRelatedState, TimelineEntry } from "./types";

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
	const { callbacks, timekeeper } = context;

	return {
		changes: callbacks.entries(),
		animations: [timekeeper],
	};
};

const getDecendents = (element: HTMLElement) =>
	Array.from(element.querySelectorAll("*")) as HTMLElement[];

const isTextNode = (element: HTMLElement) => {
	if (!element.hasChildNodes()) {
		return;
	}

	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()));
};

const setElementRelatedState = (context: Context): ElementRelatedState => {
	const { options, elementTranslations, worker } = context;

	const parents = new Map<HTMLElement, HTMLElement>();
	const sibilings = new Map<HTMLElement, HTMLElement | null>();
	const elementResets = new Map<HTMLElement, Map<string, string>>();

	const transferableParents = new Map<string, string>();
	const easings = new Map<string, Set<TimelineEntry>>();
	const ratios = new Map<string, number>();
	const types = new Set<string>();

	const elementRelations = new Map<HTMLElement, Set<string>>();

	options.forEach((option, id) => {
		const rootElement = elementTranslations.get(option.root)!;
		getDecendents(rootElement).forEach((element) => {
			elementRelations.set(element, (elementRelations.get(element) ?? new Set()).add(id));
		});
		elementResets.set(rootElement, saveOriginalStyle(rootElement));
	});

	elementRelations.forEach((ids, element) => {
		const key = getOrAddKeyFromLookup(element, elementTranslations);
		elementResets.set(element, saveOriginalStyle(element));
		parents.set(element, element.parentElement!);
		sibilings.set(element, element.nextElementSibling as HTMLElement | null);
		transferableParents.set(
			key,
			getOrAddKeyFromLookup(element.parentElement!, elementTranslations)
		);
		easings.set(
			key,
			new Set(
				Array.from(ids, (id) => {
					const { start, end, easing } = options.get(id)!;
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
	});

	worker("state").reply("sendState", {
		parents: transferableParents,
		easings,
		ratios,
		types,
	});

	return {
		parents,
		sibilings,
		elementResets,
	};
};

export const getAnimationStateMachine = (context: Context) => {
	const { timekeeper, worker } = context;

	let nextPlayState = "play";
	let time = Date.now();

	let elementState: null | ElementRelatedState = null;
	let dimensionState: null | DimensionState = null;
	let observer: null | MutationObserver = null;

	const resetState = () => {
		elementState ??= setElementRelatedState(context);
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
				observer?.disconnect();
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
