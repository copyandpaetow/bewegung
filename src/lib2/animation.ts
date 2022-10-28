import { normalizeProps } from "./normalize/structure";
import { computeSecondaryProperties } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { calculateTotalRuntime } from "./prepare/runtime";
import { initialState, setState } from "./prepare/state";
import { setCallbackAnimations } from "./read/animation-callbacks";
import { setDefaultCalculations } from "./read/animation-default";
import { setImageCalculations } from "./read/animation-image";
import { initialAnimationState, setReadouts } from "./read/dom";
import { addStyleCallback } from "./read/style-callback";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import { AnimationEntry, AnimationsAPI, BewegungProps } from "./types";

/*
TODO: in here calculate the animations only, if they are done they will get back to the class
- we resolve a promise with the result so we know when it is done
- we try and catch here and possibliy reject the promise

? what do we need to give the class? A handle to reset the elements, to stop the reactivity, the callbacks


*/

interface Result {
	animations: Map<HTMLElement, Animation>;
	callbackAnimations: Map<HTMLElement, Animation>;
	resetElementStyle: (element: HTMLElement) => void;
	onStart: (element: HTMLElement) => void;
	onEnd: (element: HTMLElement) => void;
	observe: () => void;
	unobserve: () => void;
}

export const getAnimations = (...props: BewegungProps): AnimationsAPI => {
	let now = performance.now();

	const state = initialState();

	function init() {
		const animtionEntries: AnimationEntry[] = [];
		const tasks = [
			() => normalizeProps(animtionEntries, ...props),
			() => setState(state, animtionEntries),
			prepare,
		];

		tasks.forEach(scheduleCallback);
	}

	function prepare() {
		const { totalRuntime } = state;

		const tasks = [
			() => computeSecondaryProperties(state),
			() => calculateTotalRuntime(state),
			() => updateKeyframeOffsets(state, totalRuntime),
			() => updateCallbackOffsets(state, totalRuntime),
			read,
		];

		tasks.forEach(scheduleCallback);
	}

	function read() {
		const animationState = initialAnimationState();

		//if we are reacting and calculate entries again, we need to replace instead of push
		const tasks = [
			() => setReadouts(animationState, state),
			() => adjustForDisplayNone(animationState),
			() => addStyleCallback(animationState, state),
			() => setDefaultCalculations(animationState, state),
			() => setImageCalculations(animationState, state),
			() => setCallbackAnimations(state),
		];

		tasks.forEach(scheduleCallback);
	}

	function watch() {
		//if a placestate is not init anymore return early
		//if a mutation occurs check if the
		// it should return a function to start and one to end the watching
		// since the animation list needs to be updated in need we cant garbage collect here so we can lean into the closure even more
		//TODO return a connect and a disconnect function (or function that returns the other again and again)
	}

	init();

	scheduleCallback(() =>
		console.log({
			duration: performance.now() - now,
		})
	);

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
