import { ReadDimensions } from "../core/main-read-dimensions";
import { firstIn, toArray } from "../utils/array-helpers";

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}

export interface TimelineResult {
	start: number;
	end: number;
	easing: string;
}

export type Timeline = TimelineEntry[];

const transformEasings = (easings: string[]): string => {
	const cubicValues = easings.map((easing) => {
		if (easing === "linear") {
			return [0, 0, 1, 1];
		}
		if (easing === "ease") {
			return [0.25, 0.1, 0.25, 1];
		}
		if (easing === "ease-in-out") {
			return [0.42, 0, 0.58, 1];
		}
		if (easing === "ease-in") {
			return [0.42, 0, 1, 1];
		}
		if (easing === "ease-out") {
			return [0, 0, 0.58, 1];
		}
		if (easing.includes("cubic-bezier")) {
			const stringArray = easing.split("(")[1].split(")")[0].split(",");
			return stringArray.map((stringNumber) => Number(stringNumber));
		}
		return [0, 0, 1, 1];
	});
	const newValues = cubicValues.reduce((accumulator, current) => {
		const [a1, a2, a3, a4] = accumulator;
		const [c1, c2, c3, c4] = current;

		return [
			Math.max(a1, c1),
			Math.max(a2, c2),
			Math.max(a3, c3),
			Math.max(a4, c4),
		];
	});

	return `cubic-bezier(${newValues[0]}, ${newValues[1]}, ${newValues[2]}, ${newValues[3]})`;
};

const getTimelineFractions = (
	timeline: Timeline,
	sortedTimeline: Timeline = []
): Timeline => {
	if (timeline.length === 0) {
		return sortedTimeline;
	}

	if (timeline.length === 1) {
		const { start, end, easing } = firstIn(timeline);
		return [
			...sortedTimeline,
			{ start, end, easing: Array.isArray(easing) ? firstIn(easing) : easing },
		];
	}

	// find lowest number
	const lowestNumber = Math.min(...timeline.map(({ start }) => start));
	// find second lowest number
	const secondLowestNumber = timeline.reduce(
		(prevSecondLowestNumber: number, current: TimelineEntry) => {
			const { start, end } = current;
			return lowestNumber === start
				? Math.min(prevSecondLowestNumber, end)
				: Math.min(prevSecondLowestNumber, start, end);
		},
		Infinity
	);

	// get all entries with the lowest number
	const entriesWithLowestNumber = timeline.filter(
		({ start }) => start === lowestNumber
	);

	// create a new element with these numbers and all easings from the first step
	const newSortedEntry = entriesWithLowestNumber.reduce(
		(accumulator, current, index, array) => {
			const { easing, end, start } = current;
			const prevStart = accumulator?.start || start;
			const prevEasing = accumulator?.easing || [];
			const newEasing = toArray(prevEasing).concat(easing);
			return {
				start: prevStart,
				end: end === secondLowestNumber ? end : secondLowestNumber,
				easing:
					index === array.length - 1 ? transformEasings(newEasing) : newEasing,
			};
		},
		{} as TimelineEntry
	);

	// modify all entries and replace all occurrences with the second lowest number
	// remove all entries where start and end are the same

	const newTimeline: Timeline = timeline
		.map(
			({ start, end, easing }: TimelineEntry): TimelineEntry => ({
				start: start === lowestNumber ? secondLowestNumber : start,
				end,
				easing: toArray(easing),
			})
		)
		.filter(({ start, end }) => start !== end);

	return getTimelineFractions(newTimeline, [...sortedTimeline, newSortedEntry]);
};

export const getTimingsFromElements = (
	elements: HTMLElement[],
	animationMap: Map<HTMLElement, ReadDimensions>,
	totalRunTime: number
) => {
	const elementTimings = elements.map((entry) => {
		const {
			delay: start,
			endTime: end,
			easing,
		} = (
			animationMap.get(entry) as ReadDimensions
		).keyframeInstance.getComputedTiming();

		return {
			start: (start as number) / totalRunTime,
			end: (end as number) / totalRunTime,
			easing,
		} as TimelineEntry;
	});
	return getTimelineFractions(elementTimings);
};
