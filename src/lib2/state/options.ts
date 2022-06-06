import { execute, iterateWeakMap } from "../helper/iterables";
import { state_mainElements } from "./elements";

export let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();

export let totalRuntime = 0;
export const compute_runtime = () => {
	let longestDuration = 0;
	iterateWeakMap(
		state_mainElements,
		state_options
	)((value) => {
		longestDuration = Math.max(value.endTime, longestDuration);
	});

	totalRuntime = longestDuration;
};
const flow = execute(compute_runtime);

export const action_updateOptions = () => {
	flow();
};
