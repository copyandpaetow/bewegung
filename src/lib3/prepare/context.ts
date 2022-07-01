import { defaultChangeProperties } from "../constants";
import { Chunks, cssRuleName } from "../types";

export const Context = {
	changeTimings: [0, 1],
	changeProperties: defaultChangeProperties,
	totalRuntime: 400,
};

export const updateTotalRuntime = (times: number[]) => {
	Context.totalRuntime = times.reduce((longest, current) =>
		Math.max(longest, current)
	);
};

export const updateChangeTimings = (
	allKeyframes: ComputedKeyframe[][],
	options: ComputedEffectTiming[]
) => {
	const newTimings = new Set([0, 1]);
	const totalRuntime = Context.totalRuntime;

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
	Context.changeTimings = Array.from(newTimings).sort((a, b) => a - b);
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
	Context.changeProperties = Array.from(changeProperties);
};

export const calculateContext = (chunks: Chunks[]) => {
	const keyframes = chunks.map((chunk) => chunk.keyframes);
	const options = chunks.map((chunk) => chunk.options);

	updateTotalRuntime(options.map((option) => option.endTime!));
	updateChangeTimings(keyframes, options);
	updateChangeProperties(keyframes);

	return Context;
};
