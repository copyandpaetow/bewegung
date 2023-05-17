import { createAnimationState } from "./create-animation-state";
import { AnimationState, ClientAnimationTree, MainMessages, WorkerMessages } from "../types";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { createMachine } from "../utils/state-machine";
import { getWorker, useWorker } from "../utils/use-worker";
import { Attributes } from "../utils/constants";

const walkAnimationTree = (tree: ClientAnimationTree, callback: (animation: Animation) => void) => {
	if (tree.animation) {
		callback(tree.animation);
	}
	tree.children.forEach((child) => walkAnimationTree(child, callback));
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

	let animationState: null | AnimationState = null;

	const resetState = async () => {
		await nextRaf();
		animationState = await createAnimationState(callbacks, totalRuntime, worker);
		animationState?.animations.set("timekeeper", {
			animation: timekeeper,
			children: [],
			key: "timekeeper",
		});
	};

	const machine = createMachine({
		initialState: "idle",
		actions: {
			async loadState() {
				try {
					await nextRaf();
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

				animationState?.animations.forEach((animation) => {
					walkAnimationTree(animation, (anim) => {
						anim.play();
					});
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
				querySelectorAll(`[${Attributes.key}]`).forEach((element) => {
					Object.keys(element.dataset).forEach((attributeName) => {
						if (attributeName.includes("bewegung")) {
							delete element.dataset[attributeName];
						}
					});
				});
			},
			resetElements() {
				animationState?.elementResets.forEach((attributes, element) => {
					if (element.dataset.bewegungsRemoveable) {
						animationState?.elementResets.delete(element);
						element.remove();
						return;
					}

					attributes.forEach((value, key) => {
						element.setAttribute(key, value);
					});
				});
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
