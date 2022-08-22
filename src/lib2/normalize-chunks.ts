import { Callbacks, Chunks } from "./types";

const updateKeyframeTiming = (
	frame: ComputedKeyframe | Callbacks,
	options: ComputedEffectTiming,
	totalRuntime: number
) => {
	const { delay: start, endTime } = options;

	const absoluteTiming =
		//@ts-expect-error stupid typescript
		(endTime! * (frame.offset || frame.computedOffset) + start!) / totalRuntime;

	return {
		...frame,
		offset: absoluteTiming,
	};
};

export const normalizeChunks = (
	chunks: Chunks[],
	totalRuntime: number
): Chunks[] =>
	chunks.map((chunk) => {
		const { callbacks, keyframes, options, target, selector } = chunk;
		const updatedKeyframes = keyframes.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		) as ComputedKeyframe[];
		const updatedCallbacks = callbacks?.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		) as Callbacks[];

		return {
			callbacks: updatedCallbacks,
			keyframes: updatedKeyframes,
			options,
			target,
			selector,
		};
	});
