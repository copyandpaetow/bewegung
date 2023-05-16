import {
	Attributes,
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	ElementOrSelector,
	TimelineEntry,
} from "./types";
import { defaultOptions } from "./utils/constants";
import { uuid } from "./utils/helper";

const computeCallbacks = (props: PropsWithRelativeTiming[]) => {
	const callbacks = new Map<number, VoidFunction[]>();
	const timings = new Set([0, ...props.map((entry) => entry.end)]);

	timings.forEach((currentTime) => {
		const relevantEntries = props.filter((entry) => entry.end <= currentTime);

		callbacks.set(currentTime, [...new Set(relevantEntries.map((entry) => entry.callback))]);
	});

	return callbacks;
};

const getElement = (element: ElementOrSelector) => {
	if (typeof element !== "string") {
		return element as HTMLElement;
	}
	return document.querySelector(element) as HTMLElement;
};

type NormalizedProps = Required<BewegungsOption> & { callback: VoidFunction };
const normalizeOptions = (props: BewegungsEntry[], config?: BewegungsConfig): NormalizedProps[] =>
	props.map((entry) => {
		const callback = entry?.[0] ?? entry;
		const options = entry?.[1] ?? {};

		const combinedOptions: Required<BewegungsOption> = {
			...defaultOptions,
			...(config?.defaultOptions ?? {}),
			...(options ?? {}),
		};

		return { ...combinedOptions, callback };
	});

const getTotalRuntime = (props: NormalizedProps[]) =>
	props.reduce((accumulator, current) => {
		return accumulator + current.at + current.duration;
	}, 0);

type PropsWithRelativeTiming = {
	start: number;
	end: number;
	iterations: number;
	root: ElementOrSelector;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
	callback: VoidFunction;
};
const getRelativeTimings = (
	props: NormalizedProps[],
	totalRuntime: number
): PropsWithRelativeTiming[] => {
	let currentTime = 0;

	return props.map((entry) => {
		const { duration, at, ...remainingOptions } = entry;

		const start = (currentTime = currentTime + at) / totalRuntime;
		const end = (currentTime = currentTime + duration) / totalRuntime;

		return {
			...remainingOptions,
			start,
			end,
		};
	});
};

const getChildElements = (element: HTMLElement) => Array.from(element.children) as HTMLElement[];

const addTextAttribute = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType !== 3) {
			return;
		}
		text += node.textContent!.trim().length;
	});
	if (text === 0) {
		return;
	}

	element.dataset.bewegungsText = `${text}`;
};

const addMediaRatioAttribute = (element: HTMLElement) => {
	//@ts-expect-error
	if (!element.naturalWidth || !element.naturalHeight) {
		return;
	}
	element.dataset.bewegungsRatio = `${
		(element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight
	}`;
};

const addSkipAttribute = (element: HTMLElement) => {
	if (element.getAnimations().some((animation) => animation.playState === "running")) {
		element.dataset.bewegungsSkip = "";
	}
};

const labelElements = (element: HTMLElement) => {
	if (element.dataset.bewegungsKey) {
		return;
	}
	element.dataset.bewegungsKey = uuid(element.tagName);
	addTextAttribute(element);
	addMediaRatioAttribute(element);
	addSkipAttribute(element);

	getChildElements(element).forEach(labelElements);
};

const labelRootElements = (propsWithRelativeTiming: PropsWithRelativeTiming[]) => {
	const rootMap = new Map<HTMLElement, TimelineEntry[]>();

	propsWithRelativeTiming.forEach((entry) => {
		const { start, end, easing, root } = entry;
		const rootElement = getElement(root);

		rootMap.set(rootElement, (rootMap.get(rootElement) ?? []).concat([{ start, end, easing }]));
	});

	rootMap.forEach((timelineEntry, domElement) => {
		const key = uuid(`root`);
		domElement.dataset.bewegungsKey = key;
		domElement.dataset.bewegungsEasing = JSON.stringify(timelineEntry);

		getChildElements(domElement).forEach(labelElements);
	});
};

export const normalizeProps = (props: BewegungsEntry[], config?: BewegungsConfig) => {
	const normalizedProps = normalizeOptions(props, config);
	const totalRuntime = getTotalRuntime(normalizedProps);

	const withStartAndEndTimes = getRelativeTimings(normalizedProps, totalRuntime);
	const callbacks = computeCallbacks(withStartAndEndTimes);

	requestAnimationFrame(() => labelRootElements(withStartAndEndTimes));

	return {
		callbacks,
		totalRuntime,
	};
};
