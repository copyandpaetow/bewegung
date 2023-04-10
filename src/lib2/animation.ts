import { createAnimations } from "./create-animations";
import { createState } from "./create-state";
import { createAnimationState } from "./observe-dom";
import { createMachine } from "./state-machine";
import { AnimationState, InternalProps, MainState } from "./types";

// const isTextNode = (element: HTMLElement) => {
// 	if (!element.hasChildNodes()) {
// 		return;
// 	}

// 	//TODO: investigate if node.nodeType === 3 is faster
// 	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()));
// };

export const getAnimationStateMachine = (internalProps: InternalProps, timekeeper: Animation) => {
	let nextPlayState = "play";
	let time = Date.now();

	let state: null | MainState = null;
	let animationState: null | AnimationState = null;

	const resetState = async () => {
		if (!state) {
			state = createState(internalProps);
			state.worker("state").reply("sendState", { parents: state.parents, options: state.options });
			animationState = null;
		}
		animationState ??= await createAnimationState(state, internalProps.totalRuntime);
		animationState.animations.set("timekeeper", timekeeper);
	};

	const machine = createMachine({
		initialState: "idle",
		actions: {
			async loadState() {
				try {
					await resetState();
					machine.transition(nextPlayState);
				} catch (error) {
					machine.transition("cancel");
				}
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

				animationState?.animations.forEach((animation) => {
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
			},
			cancelAnimations() {
				console.log("cancelAnimations");
			},
			cleanup() {
				console.log("cleanup");
			},
			resetElements() {
				animationState?.elementResets.forEach((reset, key) => {
					const domElement = state?.elementTranslations.get(key)!;
					//TODO: remove added and add removed, reset existing attributes
				});
				console.log("resetElements");
			},
		},
		guards: {
			isStateLoaded() {
				return [state, animationState].every(Boolean);
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
