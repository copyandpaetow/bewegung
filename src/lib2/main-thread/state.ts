import { EveryOptionSyntax } from "../types";
import { BidirectionalMap, uuid } from "../utils";

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

export const getRootSelector = (options: EveryOptionSyntax) => {
	if (!options || typeof options === "number" || !options.rootSelector) {
		return "body";
	}
	return options.rootSelector;
};
