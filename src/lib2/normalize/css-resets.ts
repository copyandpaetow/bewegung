import { BidirectionalMap } from "../utils";

export const saveOriginalStyle = (element: HTMLElement) => {
	const allAttributes = new Map<string, string>([["style", ""]]);
	element.getAttributeNames().forEach((attribute) => {
		allAttributes.set(attribute, element.getAttribute(attribute)!);
	});

	return allAttributes;
};

export const restoreOriginalStyle = (
	element: HTMLElement,
	savedAttributes: Map<string, string> | undefined
) => {
	if (!savedAttributes) {
		return;
	}
	const currentAttributes = new Set(element.getAttributeNames());

	savedAttributes.forEach((value, key) => {
		element.setAttribute(key, value);

		if (!currentAttributes.has(key)) {
			return;
		}
		currentAttributes.delete(key);
	});

	currentAttributes.forEach((attribute) => {
		element.removeAttribute(attribute);
	});
};

export const saveMainElementStyles = (
	elements: Map<string, string[]>,
	elementLookup: BidirectionalMap<string, HTMLElement>
) => {
	const elementResets = new Map<string, Map<string, string>>();

	elements.forEach((elementStrings, chunkID) => {
		elementStrings.forEach((elementString) => {
			const domElement = elementLookup.get(elementString)!;
			elementResets.set(elementString, saveOriginalStyle(domElement));
		});
	});

	return elementResets;
};
