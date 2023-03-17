import { defaultOptions } from "./constants";
import { BewegungsBlock, BewegungsConfig, BewegungsOptions } from "./types";

export const normalizeProps = (
	props: BewegungsBlock[],
	globalConfig?: BewegungsConfig
): BewegungsOptions[] => {
	return props.map((entry) => {
		const callback = entry?.[0] ?? entry;
		const options = entry?.[1] ?? {};

		const combinedOptions = {
			...defaultOptions,
			...(globalConfig ?? {}),
			...(options ?? {}),
		};

		return [callback, combinedOptions];
	});
};

export const calculateTotalRuntime = (props: BewegungsOptions[]) =>
	props.reduce((accumulatedTime, currentProp) => {
		const { duration, at } = currentProp[1];

		return accumulatedTime + duration + at;
	}, 0);

/*
2000 + 200
4000 - 500


0 200 1700 2200 5700

*/

const isWithinRange = (entry: [number, number, VoidFunction], time: number) => {
	const [start, end] = entry;

	return time >= start || time <= end;
};

const splitPartialHits = (
	entry: [number, number, VoidFunction],
	time: number,
	nextTime: number | undefined
): [number, number, VoidFunction][] => {
	const [start, end, callback] = entry;

	if (!nextTime) {
		return [];
	}

	if (time === start && nextTime > end) {
		return [[start, nextTime, callback]];
	}

	if (time > start && nextTime === end) {
		return [[time, end, callback]];
	}

	return [entry];
};

export const computeTimeline = (props: BewegungsOptions[], totalRuntime: number) => {
	let currentTime = 0;
	const timings = new Set([currentTime]);
	const propTimeline: [number, number, VoidFunction][] = [];

	props.forEach((entry) => {
		const [callback, options] = entry;
		const { duration, at } = options;

		const start = (currentTime = currentTime + at);
		const end = (currentTime = currentTime + duration);
		timings.add(start);
		timings.add(end);
		propTimeline.push([start, end, callback]);
	});

	const timeline = new Map<number, Set<VoidFunction>>();

	Array.from(timings)
		.sort((a, b) => a - b)
		.forEach((time, index, array) => {
			propTimeline
				.filter((entry) => isWithinRange(entry, time))
				.flatMap((entry) => splitPartialHits(entry, time, array.at(index + 1)))
				.forEach((entry) => {
					const [start, _, callback] = entry;
					timeline.set(start, (timeline.get(start) ?? new Set<VoidFunction>()).add(callback));
				});
		});

	return timeline;
};
