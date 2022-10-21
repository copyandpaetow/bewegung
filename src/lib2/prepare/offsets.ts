import { BewegungsOptions, Callbacks, CustomKeyframe, State } from "../types";

const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions,
	totalRuntime: number
) =>
	entry.map((frame) => {
		const absoluteTiming = ((options.endTime as number) * frame.offset!) / totalRuntime;

		return {
			...frame,
			offset: absoluteTiming,
		};
	});

export const updateKeyframeOffsets = (state: State) => {
	const { mainElements, options, keyframes, totalRuntime } = state;

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = keyframes
			.get(element)!
			.map((frame, index) => updateOffsets(frame, option[index], totalRuntime));
		keyframes.set(element, currentValue);
	});
};

export const updateCallbackOffsets = (state: State) => {
	const { mainElements, options, callbacks, totalRuntime } = state;

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = callbacks
			.get(element)!
			.map((callback, index) => updateOffsets(callback, option[index], totalRuntime));
		callbacks.set(element, currentValue);
	});
};
