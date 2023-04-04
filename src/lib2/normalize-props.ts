import { defaultOptions } from "./constants";
import { BidirectionalMap, getOrAddKeyFromLookup } from "./element-translations";
import {
	BewegungsBlock,
	BewegungsConfig,
	BewegungsOptions,
	ElementOrSelector,
	MainMessages,
	MainState,
	NormalizedOptions,
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

const computeCallbacks = (props: BewegungsOptions[], totalRuntime: number) => {
	const callbacks = new Map<number, VoidFunction[]>();
	const options = new Map<VoidFunction, NormalizedOptions>();
	const elementTranslations = new BidirectionalMap<string, HTMLElement>();
	let currentTime = 0;

	const timings = new Set([currentTime]);
	const propTimeline = props
		.map((entry) => {
			const [callback, option] = entry;
			const { duration, at, root, ...remainingOptions } = option;
			const rootKey = getOrAddKeyFromLookup(getElement(root), elementTranslations);

			const start = (currentTime = currentTime + at) / totalRuntime;
			const end = (currentTime = currentTime + duration) / totalRuntime;
			timings.add(end);
			options.set(callback, {
				...remainingOptions,
				root: rootKey,
				start,
				end,
			});
			return { start, end, callback };
		})
		.sort((a, b) => a.start - b.start);

	timings.forEach((time) => {
		const entries = propTimeline.filter((entry) => entry.end <= time);

		callbacks.set(time, [...new Set(entries.map((entry) => entry.callback))]);
	});
	return { callbacks, options, elementTranslations };
};

export const createState = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): MainState => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const totalRuntime = calculateTotalRuntime(normalizedProps);
	const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	return {
		...outsidePromise(),
		...computeCallbacks(normalizedProps, totalRuntime),
		timekeeper,
		totalRuntime,
		parents: new Map<string, string>(),
		siblings: new Map<string, string | null>(),
		elementResets: new Map<string, Map<string, string>>(),
		easings: new Map<string, Set<TimelineEntry>>(),
		ratios: new Map<string, number>(),
		types: new Set<string>(),
		worker: useWorker<MainMessages, WorkerMessages>(workerManager.current()),
		animations: new Map([["timekeeper", timekeeper]]),
		onStart: normalizedProps.map((entry) => entry[0]),
	};
};
