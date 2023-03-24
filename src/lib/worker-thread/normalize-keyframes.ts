import { BewegungsOptions, CustomKeyframe } from "../types";

//?: if the lastOffset is equal to the newOffset, their keyframes will get mashed together eventually
// with newOffset === lastOffset ? newOffset + 0.0001 : newOffset, this could be avoided but it creates a flicker and doesnt look that great
export const updateOffsets = (
	keyframes: CustomKeyframe[],
	options: BewegungsOptions,
	totalRuntime: number
): CustomKeyframe[] => {
	const { duration, delay: start, endDelay, iterations, direction, endTime } = options;
	if (iterations === Infinity) {
		throw new Error("cant calculate with Infinity");
	}

	const updatedFrames: CustomKeyframe[] = [];
	const reversedEntry: CustomKeyframe[] = [...keyframes].reverse();

	if (start! > 0) {
		updatedFrames.push({
			offset: (start! - 0.01) / totalRuntime,
		});
	}

	if (endDelay! > 0) {
		updatedFrames.push({
			offset: (endTime! - endDelay! + 0.01) / totalRuntime,
		});
	}

	Array.from(Array(iterations), (_, iteration) => {
		const isForward =
			direction === "normal" ||
			(direction === "alternate" && iteration % 2 === 0) ||
			(direction === "alternate-reverse" && iteration % 2 !== 0);

		const currentFrame = isForward ? keyframes : reversedEntry;

		currentFrame.forEach((frame) => {
			const currentOffset = frame.offset! + iteration;
			const newOffset = (start! + (duration as number) * currentOffset - endDelay!) / totalRuntime;

			updatedFrames.push({
				...frame,
				offset: newOffset,
			});
		});
	});
	return updatedFrames;
};

//if the readouts get filtered, we need to include content within, otherwise just the offsets
export const fillImplicitKeyframes = (keyframes: CustomKeyframe[]): CustomKeyframe[] => {
	const updatedKeyframes = [...keyframes];
	const firstKeyframe = updatedKeyframes.at(0)!;
	const lastKeyframe = updatedKeyframes.at(-1)!;

	if (firstKeyframe.offset !== 0) {
		//updatedKeyframes.unshift({ ...firstKeyframe, offset: 0 });
		updatedKeyframes.unshift({ offset: 0 });
	}
	if (lastKeyframe.offset !== 1) {
		//updatedKeyframes.push({ ...lastKeyframe, offset: 1 });
		updatedKeyframes.push({ offset: 0 });
	}

	return updatedKeyframes;
};
