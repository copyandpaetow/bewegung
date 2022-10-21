import { CalculationState, Timeline, TimelineEntry } from "../types";
import { ImageState } from "./animation-image";

export const toArray = <MaybeArrayType>(
	maybeArray: MaybeArrayType | MaybeArrayType[]
): MaybeArrayType[] => (Array.isArray(maybeArray) ? maybeArray : [maybeArray]);

const easingValues = {
	linear: [0, 0, 1, 1],
	ease: [0.25, 0.1, 0.25, 1],
	"ease-in": [0.42, 0, 1, 1],
	"ease-out": [0, 0, 0.58, 1],
	"ease-in-out": [0.42, 0.0, 0.58, 1.0],
};

const getEasingFromCubicBezier = (easing: string): [number, number, number, number] | undefined => {
	if (!easing.includes("cubic-bezier")) {
		return;
	}
	const stringArray = easing.split("(")[1].split(")")[0].split(",");
	return stringArray.map((stringNumber) => Number(stringNumber)) as [
		number,
		number,
		number,
		number
	];
};

const transformEasings = (easings: string[]): string => {
	let easingPoints = [0, 0, 0, 0];

	easings.forEach((easing) => {
		const [p0, p1, p2, p3] = getEasingFromCubicBezier(easing) ??
			easingValues[easing as "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"] ?? [
				0, 0, 1, 1,
			];

		easingPoints = [
			Math.max(easingPoints[0], p0),
			Math.max(easingPoints[1], p1),
			Math.max(easingPoints[2], p2),
			Math.max(easingPoints[3], p3),
		];
	});

	return `cubic-bezier(${easingPoints[0]}, ${easingPoints[1]}, ${easingPoints[2]}, ${easingPoints[3]})`;
};

export const getTimelineFractions = (
	timeline: Timeline,
	sortedTimeline: Timeline = []
): Timeline => {
	if (timeline.length === 0) {
		return sortedTimeline;
	}

	if (timeline.length === 1) {
		const { start, end, easing } = timeline[0];
		return [...sortedTimeline, { start, end, easing: Array.isArray(easing) ? easing[0] : easing }];
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
	const entriesWithLowestNumber = timeline.filter(({ start }) => start === lowestNumber);

	// create a new element with these numbers and all easings from the first step
	const newSortedEntry = entriesWithLowestNumber.reduce((accumulator, current, index, array) => {
		const { easing, end, start } = current;
		const prevStart = accumulator?.start || start;
		const prevEasing = accumulator?.easing || [];
		const newEasing = toArray(prevEasing).concat(easing);
		return {
			start: prevStart,
			end: end === secondLowestNumber ? end : secondLowestNumber,
			easing: index === array.length - 1 ? transformEasings(newEasing) : newEasing,
		};
	}, {} as TimelineEntry);

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

export const calculateEasingMap = (
	calculationState: CalculationState | ImageState,
	mainElementOptions: ComputedEffectTiming[],
	totalRuntime: number
) => {
	const timings: Timeline = mainElementOptions.map(({ delay, duration, easing }) => ({
		start: (delay as number) / totalRuntime,
		end: (duration as number) / totalRuntime,
		easing: easing as string,
	}));

	getTimelineFractions(timings).forEach((entry, index, array) => {
		const { start } = entry;
		const easing = array[index].easing as string;

		calculationState.easingTable[start] = easing;
	});
};
