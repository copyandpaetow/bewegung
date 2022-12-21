import { BewegungsOptions, CustomKeyframe, EveryKeyframeSyntax } from "../types";
import { unifyKeyframeStructure } from "./normalize-keyframe-structure";

//?: if the lastOffset is equal to the newOffset, their keyframes will get mashed together eventually
// with newOffset === lastOffset ? newOffset + 0.0001 : newOffset, this could be avoided but it creates a flicker and doesnt look that great
const updateOffsets = (
	keyframes: CustomKeyframe[],
	options: BewegungsOptions,
	totalRuntime: number
): CustomKeyframe[] => {
	const { duration, delay: start, endDelay, iterations, direction } = options;
	if (iterations === Infinity) {
		throw new Error("cant calculate with Infinity");
	}

	const updatedFrames: CustomKeyframe[] = [];
	const reversedEntry: CustomKeyframe[] = [...keyframes].reverse();

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

const addIndividualEasing = (
	keyframes: CustomKeyframe[],
	options: BewegungsOptions
): CustomKeyframe[] => {
	const { easing, composite } = options;

	return keyframes.map((frame) => {
		const { offset, ...styles } = frame;

		const individualEasing = (styles.animationTimingFunction ??
			styles.transitionTimingFunction ??
			easing) as string | undefined;

		return {
			offset,
			easing: individualEasing,
			composite,
			...styles,
		};
	});
};

const fillImplicitKeyframes = (keyframes: CustomKeyframe[], options: BewegungsOptions) => {
	const { easing, composite } = options;
	const updatedKeyframes = [...keyframes];
	const firstKeyframe = updatedKeyframes.at(0)!;
	const lastKeyframe = updatedKeyframes.at(-1)!;

	if (firstKeyframe.offset !== 0) {
		updatedKeyframes.unshift({ offset: 0, easing, composite });
	}
	if (lastKeyframe.offset !== 1) {
		updatedKeyframes.push({ offset: 1, easing, composite });
	}

	return updatedKeyframes;
};

export const normalizeKeyframes = (
	allKeyframes: EveryKeyframeSyntax[],
	allOptions: BewegungsOptions[],
	totalRoundtime: number
): CustomKeyframe[][] =>
	allKeyframes
		.map(unifyKeyframeStructure)
		.map((keyframes, index) => addIndividualEasing(keyframes, allOptions[index]))
		.map((keyframes, index) => fillImplicitKeyframes(keyframes, allOptions[index]))
		.map((keyframes, index) => updateOffsets(keyframes, allOptions[index], totalRoundtime));
