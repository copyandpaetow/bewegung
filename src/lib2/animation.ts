import { normalizeProps } from "./normalize/structure";
import { initialState, setState } from "./prepare/state";
import { setImageCalculations } from "./read/animation-image";
import { setDefaultCalculations } from "./read/animation-default";
import { initialAnimationState, setReadouts } from "./read/dom";
import { addStyleCallback } from "./read/style-callback";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import {
	AnimationEntry,
	AnimationsAPI,
	BewegungProps,
	DimensionalDifferences,
	ElementReadouts,
	Overrides,
} from "./types";

/*
TODO: in here calculate the animations only, if they are done they will get back to the class
- we resolve a promise with the result so we know when it is done
- we try and catch here and possibliy reject the promise

? what do we need to give the class? A handle to reset the elements, to stop the reactivity, the callbacks


*/

interface Result {
	animations: Map<HTMLElement, Animation>;
	cssResets: WeakMap<HTMLElement, Map<string, string>>;
	callbacks: VoidFunction; // before and after speparated or together? Maybe even a reset callback as well?
}

export const getAnimations = (...props: BewegungProps): AnimationsAPI => {
	let now = performance.now();

	const state = initialState();
	//maybe a const result = initalResult()

	function init() {
		const animtionEntries: AnimationEntry[] = [];
		const tasks = [
			() => normalizeProps(animtionEntries, ...props),
			() => setState(state, animtionEntries),
			read,
		];

		tasks.forEach(scheduleCallback);
	}

	function read() {
		const animationState = initialAnimationState();

		const tasks = [
			() => setReadouts(animationState, state),
			() => adjustForDisplayNone(animationState),
			() => addStyleCallback(animationState, state),
			() => setDefaultCalculations(animationState, state),
			() => setImageCalculations(animationState, state),
			//TODO: callback animations
		];

		tasks.forEach(scheduleCallback);
	}
	init();

	scheduleCallback(() =>
		console.log({
			duration: performance.now() - now,
			state,
		})
	);

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
