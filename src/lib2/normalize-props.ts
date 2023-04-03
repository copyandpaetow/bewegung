import { defaultOptions } from "./constants";
import {
	BidirectionalMap,
	getOrAddCallbackFromLookup,
	getOrAddKeyFromLookup,
} from "./element-translations";
import {
	BewegungsBlock,
	BewegungsConfig,
	BewegungsOptions,
	Context,
	ElementOrSelector,
	MainMessages,
	NormalizedOptions,
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

//TODO: check if the callback-id is used or delete this
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
