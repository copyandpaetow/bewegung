import { defaultChangeProperties } from "../constants";
import { Chunks, cssRuleName } from "../types";

const updateTotalRuntime = (times: number[]) => {
	return times.reduce((longest, current) => Math.max(longest, current));
};

const updateChangeTimings = (
	allKeyframes: ComputedKeyframe[][],
	options: ComputedEffectTiming[],
	totalRuntime: number
) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes, index) => {
		const { delay: start, duration: end, endDelay } = options[index];

		keyframes.forEach(({ offset, computedOffset }) => {
			newTimings.add(
				((end as number) * (offset || computedOffset) + (start as number)) /
					totalRuntime
			);
		});
		newTimings.add((end as number) / totalRuntime);
		if ((endDelay as number) > 0) {
			newTimings.add(((end as number) + (endDelay as number)) / totalRuntime);
		}
	});
	return Array.from(newTimings).sort((a, b) => a - b);
};

const updateChangeProperties = (allKeyframes: ComputedKeyframe[][]) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(
			({ composite, computedOffset, easing, offset, ...stylings }) => {
				Object.keys(stylings).forEach((style) =>
					changeProperties.add(style as cssRuleName)
				);
			}
		);
	});
	return Array.from(changeProperties);
};

export const calculateContext = (chunks: Chunks[]) => {
	const keyframes = chunks.map((chunk) => chunk.keyframes);
	const options = chunks.map((chunk) => chunk.options);
	const totalRuntime = updateTotalRuntime(
		options.map((option) => option.endTime!)
	);

	return {
		totalRuntime,
		changeTimings: updateChangeTimings(keyframes, options, totalRuntime),
		changeProperties: updateChangeProperties(keyframes),
		progress: 0,
	};
};
