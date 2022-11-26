import { BewegungsOptions, Callbacks, CustomKeyframe, State, WorkerState } from "../types";

//?: if the lastOffset is equal to the newOffset, their keyframes will get mashed together eventually
// with newOffset === lastOffset ? newOffset + 0.0001 : newOffset, this could be avoided but it creates a flicker and doesnt look that great
const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions,
	totalRuntime: number
): CustomKeyframe[] | Callbacks[] => {
	const { duration: untypedDuration, delay: start, endDelay, iterations, direction } = options;
	const duration = untypedDuration as number;
	if (iterations === Infinity) {
		throw new Error("cant calculate with Infinity");
	}

	const updatedFrames: CustomKeyframe[] | Callbacks[] = [];
	const reversedEntry: CustomKeyframe[] | Callbacks[] = [...entry].reverse();

	Array.from(Array(iterations), (_, iteration) => {
		const lastIterationOffset = (start! + duration * iteration - endDelay!) / totalRuntime ?? 0;

		entry.forEach((frame, index) => {
			const isForward =
				direction === "normal" ||
				(direction === "alternate" && index % 2 === 0) ||
				(direction === "alternate-reverse" && index % 2 !== 0);

			const offsetWithDirection = (isForward ? frame : reversedEntry[index]).offset as number;
			const newOffset =
				(start! + (duration * offsetWithDirection)! - endDelay!) / totalRuntime +
				lastIterationOffset;

			updatedFrames.push({
				...frame,
				offset: newOffset,
			});
		});
	});

	return updatedFrames;
};

export const updateKeyframeOffsets = (workerState: WorkerState) => {
	const { options, keyframes, totalRuntime } = workerState;
	const updatedKeyframes = new Map<string, CustomKeyframe[]>();

	keyframes.forEach((keyframeEntry, chunkID) => {
		const option = options.get(chunkID)!;

		updatedKeyframes.set(chunkID, updateOffsets(keyframeEntry, option, totalRuntime));
	});

	return updatedKeyframes;
};
