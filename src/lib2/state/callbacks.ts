import { iterateWeakMap } from "../helper/iterate-weakMap";
import { Callbacks } from "../types";
import { readDOM } from "./calculations";
import { state_mainElements } from "./elements";
import { state_options, totalRuntime } from "./options";

export let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();

const mutate_updateCallbacks = () => {
	iterateWeakMap(
		state_mainElements,
		state_callbacks
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key);

		const updatedKeyframes = value.map((frame) => {
			const absoluteTiming =
				((end as number) * frame.offset + (start as number) + endDelay) /
				totalRuntime;
			return {
				...frame,
				offset: absoluteTiming,
			};
		});

		state_callbacks.set(key, updatedKeyframes);
	});
};

export const mutate_callbacks = (
	element?: HTMLElement,
	callback?: Callbacks[],
	hasNext?: boolean
) => {
	//?before the readDOM call there could be a function to check for errors?
	//* it must be made in a way, that it can be called from the resizeObserver
	const listeners = [mutate_updateCallbacks, readDOM];

	if (element && callback) {
		state_callbacks.set(element, callback);
	}
	if (!hasNext) {
		listeners.forEach((callback) => callback());
	}
};

export const cleanup_callbacks = () => {
	state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
};
