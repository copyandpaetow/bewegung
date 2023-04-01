import { defaultOptions } from "./constants";
import {
	BidirectionalMap,
	getOrAddCallbackFromLookup,
	getOrAddKeyFromLookup,
} from "./element-translations";
import {
	AtomicWorker,
	BewegungsBlock,
	BewegungsConfig,
	BewegungsOptions,
	Context,
	ElementOrSelector,
	MainMessages,
	NormalizedOptions,
	Options,
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

// const isWithinRange = (entry: TimelineEntry, time: number) => {
// 	const { start, end } = entry;

// 	return time >= start || time <= end;
// };

// const splitPartialHits = (
// 	entry: TimelineEntry,
// 	time: number,
// 	nextTime: number | undefined
// ): TimelineEntry[] => {
// 	const { start, end, callback, easing } = entry;

// 	if (!nextTime) {
// 		return [];
// 	}

// 	if (time === start) {
// 		return [{ start, end: nextTime, callback, easing }];
// 	}

// 	if (nextTime === end) {
// 		return [{ start: time, end, callback, easing }];
// 	}

// 	return [];
// };

// const condenseTimelineEnties = (accumulator: Timeline, current: TimelineEntry) => {
// 	const { start, end, easing, callback } = current;
// 	const previousEntry = accumulator.find((entry) => entry.start === start && entry.end === end);
// 	if (!previousEntry) {
// 		accumulator.push({
// 			start,
// 			end,
// 			callbacks: new Set([callback]),
// 			easings: new Set([easing]),
// 		});
// 		return accumulator;
// 	}

// 	previousEntry.callbacks.add(callback);
// 	previousEntry.easings.add(easing);

// 	return accumulator;
// };

// const getAllRootElements = (props: BewegungsOptions[]) =>
// 	new Set(props.map((entry) => entry[1].root));

// const computeTimeline2 = (props: BewegungsOptions[], totalRuntime: number) => {
// 	let currentTime = 0;
// 	let lowestTime = 1;

// 	const timings = new Set([currentTime]);
// 	const propTimeline: TimelineEntry[] = props.map((entry) => {
// 		const [callback, options] = entry;
// 		const { duration, at, easing } = options;

// 		const start = (currentTime = currentTime + at) / totalRuntime;
// 		const end = (currentTime = currentTime + duration) / totalRuntime;
// 		lowestTime = Math.min(lowestTime, start);
// 		timings.add(start);
// 		timings.add(end);
// 		return { start, end, easing, callback };
// 	});
// 	if (lowestTime !== 0) {
// 		propTimeline.push({ start: 0, end: lowestTime, easing: "linear", callback: () => {} });
// 	}

// 	const timeline = Array.from(timings)
// 		.sort((a, b) => a - b)
// 		.flatMap((time, index, array) =>
// 			propTimeline
// 				.filter((entry) => isWithinRange(entry, time))
// 				.flatMap((entry) => splitPartialHits(entry, time, array.at(index + 1)))
// 		)
// 		.reduce(condenseTimelineEnties, [] as Timeline);

// 	//start with lowest start time
// 	//find element with second lowest start time => this is the end for the first callback-block

// 	return timeline;
// };

const computeCallbacks = (props: BewegungsOptions[], totalRuntime: number) => {
	const callbacks = new Map<number, Set<VoidFunction>>();
	let currentTime = 0;

	const timings = new Set([currentTime]);
	const propTimeline = props
		.map((entry) => {
			const [callback, options] = entry;
			const { duration, at } = options;

			const start = (currentTime = currentTime + at) / totalRuntime;
			const end = (currentTime = currentTime + duration) / totalRuntime;
			timings.add(end);
			return { start, end, callback };
		})
		.sort((a, b) => a.start - b.start);

	timings.forEach((time) => {
		const entries = propTimeline.filter((entry) => entry.end <= time);

		callbacks.set(time, new Set(entries.map((entry) => entry.callback)));
	});
	return callbacks;
};

const workerManager = getWorker();

const outsidePromise = () => {
	const api = {
		resolve(value: any) {},
		reject(value: any) {},
	};
	const finishPromise = new Promise<void>((res, rej) => {
		api.resolve = res;
		api.reject = rej;
	});

	return { ...api, finishPromise };
};

const getElement = (element: ElementOrSelector) => {
	if (typeof element !== "string") {
		return element as HTMLElement;
	}
	return document.querySelector(element) as HTMLElement;
};

const makePropsTransferable = (props: BewegungsOptions[], totalRuntime: number) => {
	const options = new Map<string, NormalizedOptions>();
	const callbackTranslation = new BidirectionalMap<string, VoidFunction>();
	const elementTranslations = new BidirectionalMap<string, HTMLElement>();
	let currentTime = 0;

	props.forEach((entry) => {
		const [callback, option] = entry;
		const { duration, at, root, ...remainingOptions } = option;

		const start = (currentTime = currentTime + at) / totalRuntime;
		const end = (currentTime = currentTime + duration) / totalRuntime;

		const rootKey = getOrAddKeyFromLookup(getElement(root), elementTranslations);

		options.set(getOrAddCallbackFromLookup(callback, callbackTranslation), {
			...remainingOptions,
			root: rootKey,
			start,
			end,
		});
	});

	return { options, callbackTranslation, elementTranslations };
};

//TODO: we likely need a mapping between the elements and a stringID and maybe between the callback and a stringID

export const createContext = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Context => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const totalRuntime = calculateTotalRuntime(normalizedProps);

	//replace callback with string and a translation for the string and the callback

	return {
		...outsidePromise(),
		...makePropsTransferable(normalizedProps, totalRuntime),
		timekeeper: new Animation(new KeyframeEffect(null, null, totalRuntime)),
		callbacks: computeCallbacks(normalizedProps, totalRuntime),
		totalRuntime,
		worker: useWorker<MainMessages, WorkerMessages>(workerManager.current()),
	};
};
