import { createMachine } from "./state-machine";
import { BewegungsOptions } from "./types";

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
	const animation = new Animation(new KeyframeEffect(null, null, totalRuntime));
	animation.onfinish = callback;

	return animation;
};

const setElementRelatedState = (props: BewegungsOptions[]) => {};

export const getAnimationStateMachine = (
	props: BewegungsOptions[],
	totalRuntime: number,
	timeline: Map<number, Set<VoidFunction>>
) => {
	let elementState = null;
	let dimensionState = null;
	let timeKeeper: null | Animation = null;
	/*
		affected by outside dom changes
		- savedElementAttributes etc
		- parents, siblings
		- dimensions
	
	*/

	console.log({ props, totalRuntime, timeline });

	const machine = createMachine("idle", {
		playing: {
			actions: {
				onEnter() {
					// setup states if they dont exist
					// elementState ??= setElementRelatedState();
					// dimensionState ??= setDimensionState();
					timeKeeper ??= setTimekeeper(totalRuntime, () => machine.transition("finished"));
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
				onEnter() {
					//setup reactivity
				},
			},
			transitions: {
				play: {
					target: "playing",
					action() {
						//disable reactivity
					},
				},
			},
		},
		finished: {
			actions: {
				onEnter() {},
			},
			transitions: {},
		},
	});

	return machine;
};
