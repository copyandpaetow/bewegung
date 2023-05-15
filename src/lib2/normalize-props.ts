import {
	Attributes,
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	ElementOrSelector,
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

export const addKeyToNewlyAddedElement = (element: HTMLElement, index: number) => {
	element.setAttribute(Attributes.key, `key-added-${(element as HTMLElement).tagName}-${index}`);
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

const isChildOfAnotherRoot = (element: HTMLElement) => {
	if (element.hasAttribute(Attributes.rootEasing)) {
		return true;
	}
	if (element.tagName === "BODY") {
		return false;
	}
	isChildOfAnotherRoot(element.parentElement!);
};

const labelRootElements = (propsWithRelativeTiming: PropsWithRelativeTiming[]) => {
	const rootElements = propsWithRelativeTiming.map((entry) => {
		const rootElement = getElement(entry.root);

		const key = `${entry.start}-${entry.end}-${entry.easing}`;

		const existingString = rootElement.getAttribute(Attributes.rootEasing);
		const easingString = existingString ? existingString + "---" + key : key;

		rootElement.setAttribute(Attributes.rootEasing, easingString);
		return rootElement;
	});

	rootElements.forEach((root) => {
		if (!root.hasAttribute(Attributes.rootEasing) && isChildOfAnotherRoot(root)) {
			return;
		}
		const key = uuid(`root`);

		const existingRoot = root.getAttribute(Attributes.root);
		const newRootKey = existingRoot ? existingRoot + "---" + key : key;

		root.setAttribute(Attributes.root, newRootKey);
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
