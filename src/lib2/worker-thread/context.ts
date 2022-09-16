import { defaultChangeProperties } from "../constants";
import { CssRuleName, Chunks, ChunkOption } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

const updateChangeTimings = (
	allKeyframes: ComputedKeyframe[][],
	options: ComputedEffectTiming[],
	totalRuntime: number
) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes, index) => {
		const { delay: start, duration: end, endTime } = options[index];

		keyframes.forEach(({ offset, computedOffset }) => {
			newTimings.add(
				((end as number) * (offset || computedOffset) + (start as number)) /
					totalRuntime
			);
		});
		newTimings.add((end as number) / totalRuntime);
		newTimings.add((endTime as number) / totalRuntime);
	});
	return Array.from(newTimings).sort((a, b) => a - b);
};

const updateChangeProperties = (allKeyframes: ComputedKeyframe[][]) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(
			({ composite, computedOffset, easing, offset, ...stylings }) => {
				Object.keys(stylings).forEach((style) =>
					changeProperties.add(style as CssRuleName)
				);
			}
		);
	});
	return Array.from(changeProperties);
};

export const calculateContext = (chunkState: Map<string, Chunks>) => {
	const allOptions: ChunkOption[] = [];
	const allKeyframes: ComputedKeyframe[][] = [];

	chunkState.forEach(({ options, keyframes }) => {
		allOptions.push(options);
		allKeyframes.push(keyframes);
	});

	const totalRuntime = highestNumber(
		allOptions.map((option) => option.endTime!)
	);

	return {
		totalRuntime,
		changeTimings: updateChangeTimings(allKeyframes, allOptions, totalRuntime),
		changeProperties: updateChangeProperties(allKeyframes),
	};
};
