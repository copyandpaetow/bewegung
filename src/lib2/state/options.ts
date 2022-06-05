import { iterateWeakMap } from "../helper/iterate-weakMap";
import { state_mainElements } from "./elements";
import { mutate_keyframeState } from "./keyframes";

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

//TODO: this would need to get overload so it can has 2+1 input or none
export const mutate_options = (
	element?: HTMLElement,
	option?: ComputedEffectTiming,
	hasNext?: boolean
) => {
	const listeners = [compute_runtime, mutate_keyframeState];
	if (element && option) {
		state_options.set(element, option);
	}

	if (!hasNext) {
		listeners.forEach((callback) => callback());
	}
};

export const cleanup_options = () => {
	state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
	totalRuntime = 0;
};
