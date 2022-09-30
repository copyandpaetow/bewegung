import { BewegungsOptions, Callbacks, CustomKeyframe } from "../types";

const updateKeyframeTiming = (
	frame: CustomKeyframe | Callbacks,
	options: ComputedEffectTiming,
	totalRuntime: number
) => {
	const { delay: start, endTime } = options;

	const absoluteTiming =
		//@ts-expect-error stupid typescript
		(endTime! * frame.offset + start!) / totalRuntime;

	return {
		...frame,
		offset: absoluteTiming,
	};
};

export const updateKeyframeOffsets = (
	entry: CustomKeyframe[][],
	options: BewegungsOptions[],
	totalRuntime: number
): CustomKeyframe[][] => {
	return entry.map((frames, index) =>
		frames.map((frame) => {
			return updateKeyframeTiming(frame, options[index], totalRuntime);
		})
	);
};

/*
callbacks =[[],[],[{offset: 1, callback: ()=>void}, {...}]]

*/

export const updateCallbackOffsets = (
	entry: Callbacks[][],
	options: BewegungsOptions[],
	totalRuntime: number
): Callbacks[][] => {
	//@ts-expect-error stupid typescript
	return entry.map((frames, index) => {
		if (frames.length === 0) {
			return frames;
		}

		return frames.map((frame) => {
			return updateKeyframeTiming(frame, options[index], totalRuntime);
		});
	});
};
