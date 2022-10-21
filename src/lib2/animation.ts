import { normalizeProps } from "./normalize/structure";
import { initialState, setState } from "./prepare/state";
import { setImageCalculations } from "./read/calculate-images";
import { setDefaultCalculations } from "./read/calculate-keyframes";
import { initialAnimationState, setReadouts } from "./read/dom";
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

export const getAnimations = (...props: BewegungProps): AnimationsAPI => {
	let now = performance.now();

	const state = initialState();

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
			//TODO add override styles here,
			() => setDefaultCalculations(animationState, state),
			() => setImageCalculations(animationState, state),
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
