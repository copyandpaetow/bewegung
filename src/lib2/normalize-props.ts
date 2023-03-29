import { defaultOptions } from "./constants";
import {
	AtomicWorker,
	BewegungsBlock,
	BewegungsConfig,
	BewegungsOptions,
	Context,
	MainMessages,
	Timeline,
	TimelineEntry,
	WorkerMessages,
} from "./types";
import { getWorker, useWorker } from "./use-worker";

export const normalizeProps = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
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

const isWithinRange = (entry: TimelineEntry, time: number) => {
	const { start, end } = entry;

	return time >= start || time <= end;
};

const splitPartialHits = (
	entry: TimelineEntry,
	time: number,
	nextTime: number | undefined
): TimelineEntry[] => {
	const { start, end, callback, easing } = entry;

	if (!nextTime) {
		return [];
	}

	if (time === start) {
		return [{ start, end: nextTime, callback, easing }];
	}

	if (nextTime === end) {
		return [{ start: time, end, callback, easing }];
	}

	return [];
};

const condenseTimelineEnties = (accumulator: Timeline, current: TimelineEntry) => {
	const { start, end, easing, callback } = current;
	const previousEntry = accumulator.find((entry) => entry.start === start && entry.end === end);
	if (!previousEntry) {
		accumulator.push({
			start,
			end,
			callbacks: new Set([callback]),
			easings: new Set([easing]),
		});
		return accumulator;
	}

	previousEntry.callbacks.add(callback);
	previousEntry.easings.add(easing);

	return accumulator;
};

const getAllRootElements = (props: BewegungsOptions[]) =>
	new Set(props.map((entry) => entry[1].root));

const computeTimeline = (props: BewegungsOptions[], totalRuntime: number) => {
	let currentTime = 0;
	let lowestTime = 1;

	const timings = new Set([currentTime]);
	const propTimeline: TimelineEntry[] = props.map((entry) => {
		const [callback, options] = entry;
		const { duration, at, easing } = options;

		const start = (currentTime = currentTime + at) / totalRuntime;
		const end = (currentTime = currentTime + duration) / totalRuntime;
		lowestTime = Math.min(lowestTime, start);
		timings.add(start);
		timings.add(end);
		return { start, end, easing, callback };
	});
	if (lowestTime !== 0) {
		propTimeline.push({ start: 0, end: lowestTime, easing: "linear", callback: () => {} });
	}

	return Array.from(timings)
		.sort((a, b) => a - b)
		.flatMap((time, index, array) =>
			propTimeline
				.filter((entry) => isWithinRange(entry, time))
				.flatMap((entry) => splitPartialHits(entry, time, array.at(index + 1)))
		)
		.reduce(condenseTimelineEnties, [] as Timeline);
};

const workerManager = getWorker();

export const createContext = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Context => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const totalRuntime = calculateTotalRuntime(normalizedProps);
	let resolve = (value: any) => {
		value;
	};
	let reject = () => {};
	const finishPromise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return {
		finishPromise,
		reject,
		resolve,
		timekeeper: new Animation(new KeyframeEffect(null, null, totalRuntime)),
		timeline: computeTimeline(normalizedProps, totalRuntime),
		totalRuntime,
		rootElements: getAllRootElements(normalizedProps),
		worker: useWorker<MainMessages, WorkerMessages>(workerManager.current()),
	};
};
