import { createAnimationState } from "./create-animation-state";
import { ClientAnimationTree, MainMessages, WorkerMessages } from "./types";
import { nextRaf } from "./utils/helper";
import { createMachine } from "./utils/state-machine";
import { getWorker, useWorker } from "./utils/use-worker";

/*
- elementResets

- the updateTreeStructure step could be skipped. Not much value is added there
- every data attribute we add, needs to be deleted as well
*/
const walkAnimationTree = (tree: ClientAnimationTree, method: "play" | "pause") => {
	tree.animation?.[method]();
	tree.children.forEach((child) => walkAnimationTree(child, method));
};

const workerManager = getWorker();

export const getAnimationStateMachine = (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	timekeeper: Animation
) => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	let nextPlayState = "play";
	let time = Date.now();

	let animationState: null | Map<string, ClientAnimationTree> = null;

	const resetState = async () => {
		await nextRaf();
		animationState = await createAnimationState(callbacks, totalRuntime, worker);
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
					walkAnimationTree(animation, "play");
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
