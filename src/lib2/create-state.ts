import { BidirectionalMap, getOrAddKeyFromLookup } from "./element-translations";
import {
	ElementOrSelector,
	NormalizedPropsWithCallbacks,
	NormalizedProps,
	InternalProps,
	MainMessages,
	WorkerMessages,
	MainState,
	AnimationState,
} from "./types";

import { getWorker, useWorker } from "./use-worker";

const workerManager = getWorker();

const getElement = (element: ElementOrSelector) => {
	if (typeof element !== "string") {
		return element as HTMLElement;
	}
	return document.querySelector(element) as HTMLElement;
};

const makeTransferableOptions = (
	props: NormalizedPropsWithCallbacks[],
	elementTranslations: BidirectionalMap<string, HTMLElement>
): NormalizedProps[] => {
	return props.map((entry) => {
		const { callback, root, ...remainingOptions } = entry;
		const rootKey = getOrAddKeyFromLookup(getElement(root), elementTranslations);

		return { root: rootKey, ...remainingOptions };
	});
};

export const computeCallbacks = (props: NormalizedPropsWithCallbacks[]) => {
	const callbacks = new Map<number, VoidFunction[]>();
	const timings = new Set([0, ...props.map((entry) => entry.end)]);

	timings.forEach((currentTime) => {
		const relevantEntries = props.filter((entry) => entry.end <= currentTime);

		callbacks.set(currentTime, [...new Set(relevantEntries.map((entry) => entry.callback))]);
	});

	console.log(props, callbacks);

	return callbacks;
};

const getDecendents = (element: HTMLElement) =>
	Array.from(element.querySelectorAll("*")) as HTMLElement[];

const getParentElements = (
	options: NormalizedProps[],
	elementTranslations: BidirectionalMap<string, HTMLElement>
) => {
	const parents = new Map<string, string>();

	options.forEach((option) => {
		const rootElement = elementTranslations.get(option.root)!;
		getDecendents(rootElement).forEach((element) => {
			const key = getOrAddKeyFromLookup(element, elementTranslations);

			parents.set(key, getOrAddKeyFromLookup(element.parentElement!, elementTranslations));
		});
		if (parents.has(option.root)) {
			return;
		}
		parents.set(option.root, option.root);
	});

	return parents;
};

export const createState = (internalProps: InternalProps): MainState => {
	const elementTranslations = new BidirectionalMap<string, HTMLElement>();
	const callbacks = computeCallbacks(internalProps.normalizedProps);
	const transferableOptions = makeTransferableOptions(
		internalProps.normalizedProps,
		elementTranslations
	);

	return Object.freeze({
		callbacks,
		options: transferableOptions,
		elementTranslations,
		parents: getParentElements(transferableOptions, elementTranslations),
		worker: useWorker<MainMessages, WorkerMessages>(workerManager.current()),
	});
};
