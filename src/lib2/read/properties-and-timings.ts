import { defaultChangeProperties } from "../constants";
import { cssRuleName } from "../types";

export const updateChangeTimings = (
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

export const updateChangeProperties = (allKeyframes: ComputedKeyframe[][]) => {
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
