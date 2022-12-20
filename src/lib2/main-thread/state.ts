import { saveOriginalStyle } from "./css-resets";
import { BewegungProps, EveryOptionSyntax, State, TransferObject } from "../types";
import { BidirectionalMap, uuid } from "../utils";
import { QueryableWorker } from "../worker-thread/setup";
import { normalizeElements } from "./normalize-elements";
import { unifyPropStructure } from "./normalize-props";

export const getOrAddKeyFromLookup = (
	element: HTMLElement,
	lookup: BidirectionalMap<string, HTMLElement>
) => {
	if (lookup.has(element)) {
		return lookup.get(element)!;
	}
	const key = uuid(element.tagName);
	lookup.set(key, element);

	return key;
};

const getRootSelector = (options: EveryOptionSyntax) => {
	if (!options || typeof options === "number" || !options.rootSelector) {
		return "body";
	}
	return options.rootSelector;
};

export const initState = (...props: BewegungProps): State => {
	const worker = QueryableWorker("worker.ts");
	const cssResets = new Map<HTMLElement, Map<string, string>>();
	const rootSelector = new Map<HTMLElement, string[]>();
	const selectors = new Map<string, number>();
	const elementLookup = new BidirectionalMap<string, HTMLElement>();

	const transferObject: TransferObject = {
		targets: [],
		keyframes: [],
		options: [],
	};

	unifyPropStructure(...props).forEach((entry, index) => {
		const [targets, keyframes, options] = entry;

		if (typeof targets === "string") {
			selectors.set(targets, index);
		}

		const htmlElements = normalizeElements(targets);
		const elementKeys = htmlElements.map((element) => {
			rootSelector.set(element, (rootSelector.get(element) ?? []).concat(getRootSelector(options)));
			cssResets.set(element, saveOriginalStyle(element));
			return getOrAddKeyFromLookup(element, elementLookup);
		});

		transferObject.targets[index] = elementKeys;
		transferObject.keyframes[index] = keyframes;
		transferObject.options[index] = options;
	});

	worker.sendQuery("normalizePropsInWorker", transferObject);

	return {
		cssResets,
		elementLookup,
		rootSelector,
		selectors,
		worker,
	};
};
