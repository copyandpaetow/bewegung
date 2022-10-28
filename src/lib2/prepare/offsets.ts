import { BewegungsOptions, Callbacks, CustomKeyframe, State } from "../types";

const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions,
	totalRuntime: number
) =>
	entry.map((frame) => {
		//TODO: endtime includes iterations, should we use start + duration + enddelay instead?
		//? or do we want that? What happens if two animationEntrys have different iterations?
		const absoluteTiming = ((options.endTime as number) * frame.offset!) / totalRuntime;

		return {
			...frame,
			offset: absoluteTiming,
		};
	});

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
