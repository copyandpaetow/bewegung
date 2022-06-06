import { execute, iterateWeakMap } from "../helper/iterables";
import { Callbacks } from "../types";
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

const flow = execute(mutate_updateCallbacks);

export const action_updateCallbacks = () => {
	flow();
};
