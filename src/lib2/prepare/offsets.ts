import { BewegungsOptions, Callbacks, CustomKeyframe, State } from "../types";

const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions[],
	totalRuntime: number
) =>
	entry.map((frame, index) => {
		const absoluteTiming = ((options[index].endTime as number) * frame.offset!) / totalRuntime;

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
			.map((frame) => updateOffsets(frame, option, totalRuntime));
		keyframes.set(element, currentValue);
	});
};

export const updateCallbackOffsets = (state: State) => {
	const { mainElements, options, callbacks, totalRuntime } = state;

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = callbacks
			.get(element)!
			.map((callback) => updateOffsets(callback, option, totalRuntime));
		callbacks.set(element, currentValue);
	});
};
