import { NormalizedInput } from "../bewegung";
import { cssRuleName } from "../types";

export interface Context {
	totalRunTime: number;
	changeTimings: number[];
	changeProperties: cssRuleName[];
}

const getLocalOffsets = (
	keyframeEffect: KeyframeEffect,
	totalRunTime: number
) => {
	const changeArray = new Set<number>();
	const {
		delay: start,
		duration: end,
		endDelay,
	} = keyframeEffect.getComputedTiming();
	const frames = keyframeEffect.getKeyframes();

	changeArray.add((start as number) / totalRunTime);

	frames.forEach(({ computedOffset }) => {
		changeArray.add(
			((end as number) * computedOffset + (start as number)) / totalRunTime
		);
	});

	changeArray.add((end as number) / totalRunTime);

	if ((endDelay as number) > 0) {
		changeArray.add(((end as number) + (endDelay as number)) / totalRunTime);
	}

	return changeArray;
};

export const getChangeTimings = (
	animationOption: NormalizedInput[],
	totalRunTime: number
) => {
	const allOffsets = animationOption.reduce(
		(accumulator, { keyframeInstance: keyframe }) => {
			const localOffsets = getLocalOffsets(keyframe, totalRunTime);
			return new Set([...accumulator, ...localOffsets]);
		},
		new Set<number>([0, 1])
	);

	return Array.from(allOffsets).sort((a, b) => a - b);
};

export const getChangeProperties = (animationOption: NormalizedInput[]) => {
	const changeArray = new Set<cssRuleName>([
		"transformOrigin",
		"position",
		"display",
		"borderRadius",
		"font",
	]);
	animationOption.forEach(
		({ keyframeInstance: keyframe, unAnimatableStyles }) => {
			const frames = [
				...keyframe.getKeyframes(),
				...(unAnimatableStyles || []),
			] as ComputedKeyframe[];

			frames.forEach(
				({ composite, computedOffset, easing, offset, ...stylings }) => {
					Object.keys(stylings).forEach((style) =>
						changeArray.add(style as cssRuleName)
					);
				}
			);
		}
	);

	return Array.from(changeArray);
};

export const getTotalRuntime = (animationOption: NormalizedInput[]) =>
	animationOption
		.map(({ keyframeInstance: keyframe }) => {
			const { endTime } = keyframe.getComputedTiming();
			return endTime as number;
		})
		.reduce((accumulator, entry) => Math.max(accumulator, entry));

export const createContext = (
	animationArguments: NormalizedInput[]
): Context => {
	const totalRunTime = getTotalRuntime(animationArguments);

	return {
		totalRunTime,
		changeTimings: getChangeTimings(animationArguments, totalRunTime),
		changeProperties: getChangeProperties(animationArguments),
	};
};
