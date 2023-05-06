import { createAnimationState } from "./create-animation-state";
import { AtomicWorker, ClientAnimationTree, InternalState } from "./types";
import { createMachine } from "./utils/state-machine";

/*
for later:
=> how to handle the edgecase when a root element is getting deleted?

- a helper to play/Pause all the animations
- elementResets
- calculations for text and images
- new elements for images
- we could add the start+end+easing to the tree instead of the root id. With that we wouldnt need to send the options
- how to handle the unanimatable properties?

- the updateTreeStructure step could be skipped. Not much value is added there

*/

export const getAnimationStateMachine = (
	state: InternalState,
	timekeeper: Animation,
	worker: AtomicWorker
) => {
	let nextPlayState = "play";
	let time = Date.now();

	let animationState: null | Map<string, ClientAnimationTree> = null;

	const resetState = async () => {
		if (!animationState) {
			worker("state").reply("sendState", state.options);
		}
		animationState = await createAnimationState(state, worker);
		animationState.set("timekeeper", { animation: timekeeper, children: [], key: "timekeeper" });
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

				animationState?.forEach((animation) => {
					const play = (tree: ClientAnimationTree) => {
						tree.animation?.play();
						tree.children.forEach(play);
					};
					play(animation);
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
				console.log("resetElements");
			},
		},
		guards: {
			isStateLoaded() {
				return Boolean(animationState);
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
