import { defaultOptions } from "./constants";
import {
	AtomicWorker,
	BewegungsBlock,
	BewegungsConfig,
	BewegungsOptions,
	Context,
	MainMessages,
	WorkerMessages,
} from "./types";
import { getWorker, useWorker } from "./use-worker";

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

export const computeTimeline = (props: BewegungsOptions[]) => {
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

const workerManager = getWorker();

export const createContext = (props: BewegungsBlock[], globalConfig?: BewegungsConfig): Context => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const totalRuntime = calculateTotalRuntime(normalizedProps);

	return {
		userInput: normalizedProps,
		totalRuntime,
		timeline: computeTimeline(normalizedProps),
		worker: useWorker<MainMessages, WorkerMessages>(workerManager.current()),
		timekeeper: new Animation(new KeyframeEffect(null, null, totalRuntime)),
	};
};
