import { BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_PLACEHOLDER, emptyImageSrc } from "../shared/constants";

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

export const setImageAttributes = (element: HTMLImageElement, relatedElement: HTMLElement) => {
	relatedElement.getAttributeNames().forEach((attribute) => {
		element.setAttribute(attribute, relatedElement.getAttribute(attribute)!);
	});
	element.src = emptyImageSrc;
	element.setAttribute(BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_PLACEHOLDER);
};
