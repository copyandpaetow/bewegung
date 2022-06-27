import { Chunks, cssRuleName } from "../types";

const defaultChangeProperties: cssRuleName[] = [
	"transformOrigin",
	"position",
	"display",
	"borderRadius",
	"font",
	"width",
];

const getChangeTimings = (totalRuntime: number, chunks: Chunks[]) => {
	const newTimings = new Set([0, 1]);

	chunks.forEach((chunk) => {
		const { keyframes, options } = chunk;
		const { delay: start, duration: end, endDelay } = options;
		newTimings.add((start as number) / totalRuntime);

		keyframes.forEach(({ computedOffset }) => {
			newTimings.add(
				((end as number) * computedOffset + (start as number)) / totalRuntime
			);
		});
		newTimings.add((end as number) / totalRuntime);
		if ((endDelay as number) > 0) {
			newTimings.add(((end as number) + (endDelay as number)) / totalRuntime);
		}
	});

	return Array.from(newTimings).sort((a, b) => a - b);
};

export const calculateContext = (chunks: Chunks[]) => {
	const totalRuntime = chunks
		.map((chunk) => chunk.options.endTime as number)
		.reduce((longest, current) => Math.max(longest, current));

	const changeProperties = chunks
		.map((chunk) => chunk.keyframes)
		.reduce((accumulator, current) => {
			current.forEach(
				({ composite, computedOffset, easing, offset, ...stylings }) => {
					Object.keys(stylings).forEach((style) =>
						accumulator.add(style as cssRuleName)
					);
				}
			);
			return accumulator;
		}, new Set<cssRuleName>(defaultChangeProperties));

	const changeTimings = getChangeTimings(totalRuntime, chunks);

	return {
		totalRuntime,
		changeProperties: Array.from(changeProperties),
		changeTimings,
	};
};
