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
	keyframes: CustomKeyframe[][],
	options: BewegungsOptions[],
	totalRuntime: number
) => {
	keyframes.forEach(
		(frames, index) =>
			(keyframes[index] = frames.map((frame) => {
				return updateKeyframeTiming(frame, options[index], totalRuntime);
			}))
	);
};

/*
callbacks =[[],[],[{offset: 1, callback: ()=>void}, {...}]]

*/

export const updateCallbackOffsets = (
	callbacks: Callbacks[][],
	options: BewegungsOptions[],
	totalRuntime: number
) => {
	callbacks.forEach((frames, index) => {
		if (frames.length === 0) {
			return;
		}
		//@ts-expect-error ts weirdness
		callbacks[index] = frames.map((frame) => {
			return updateKeyframeTiming(frame, options[index], totalRuntime);
		});
	});
};
