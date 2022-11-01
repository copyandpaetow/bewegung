import { BewegungsOptions, Callbacks, CustomKeyframe, State } from "../types";

const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions,
	totalRuntime: number
) => {
	const { duration, delay: start, endDelay } = options;

	return entry.map((frame) => {
		const absoluteTiming =
			(start! + (duration as number) * frame.offset! + endDelay!) / totalRuntime;

		return {
			...frame,
			offset: absoluteTiming,
		};
	});
};

export const updateKeyframeOffsets = (state: State, previousRuntime: number) => {
	const { mainElements, options, keyframes, totalRuntime } = state;

	if (totalRuntime === previousRuntime) {
		return;
	}

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = keyframes
			.get(element)!
			.map((frame, index) => updateOffsets(frame, option[index], totalRuntime));
		keyframes.set(element, currentValue);
	});
};

export const updateCallbackOffsets = (state: State, previousRuntime: number) => {
	const { mainElements, options, callbacks, totalRuntime } = state;

	if (totalRuntime === previousRuntime) {
		return;
	}

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = callbacks
			.get(element)!
			.map((callback, index) => updateOffsets(callback, option[index], totalRuntime));
		callbacks.set(element, currentValue);
	});
};
