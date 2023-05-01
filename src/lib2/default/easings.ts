import { NormalizedProps, TempTimelineEntry, TimelineEntry } from "../types";

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

const transformEasings = (entry: TempTimelineEntry): TimelineEntry => {
	let easingPoints = [0, 0, 0, 0];
	entry.easing.forEach((easing) => {
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
	return {
		...entry,
		easing: `cubic-bezier(${easingPoints[0]}, ${easingPoints[1]}, ${easingPoints[2]}, ${easingPoints[3]})`,
	};
};

const isWithinRange = (entry: TimelineEntry, time: number) => {
	const { start, end } = entry;

	return time >= start || time <= end;
};

const splitPartialHits = (
	entry: TimelineEntry,
	time: number,
	nextTime: number | undefined
): TimelineEntry[] => {
	const { start, end, easing } = entry;

	if (!nextTime) {
		return [];
	}

	if (time === start) {
		return [{ start, end: nextTime, easing }];
	}

	if (nextTime === end) {
		return [{ start: time, end, easing }];
	}

	return [];
};

const condenseTimelineEnties = (accumulator: TempTimelineEntry[], current: TimelineEntry) => {
	const { start, end, easing } = current;
	const previousEntry = accumulator.find((entry) => entry.start === start && entry.end === end);
	if (!previousEntry) {
		accumulator.push({
			start,
			end,
			easing: new Set([easing]),
		});
		return accumulator;
	}

	previousEntry.easing.add(easing);

	return accumulator;
};

const computeTimeline = (entries: TimelineEntry[]) => {
	const timings = new Set(entries.flatMap((entry) => [entry.start, entry.end]));

	const timeline = Array.from(timings)
		.sort((a, b) => a - b)
		.flatMap((time, index, array) =>
			entries
				.filter((entry) => isWithinRange(entry, time))
				.flatMap((entry) => splitPartialHits(entry, time, array.at(index + 1)))
		)
		.reduce(condenseTimelineEnties, [] as TempTimelineEntry[])
		.map(transformEasings);

	return timeline;
};

export const calculateEasings = (easings: NormalizedProps[]) => {
	const easingTable: Record<number, string> = { 0: "ease" };
	computeTimeline(easings).forEach((entry) => {
		const { end, easing } = entry;

		easingTable[end] = easing;
	});

	return easingTable;
};
