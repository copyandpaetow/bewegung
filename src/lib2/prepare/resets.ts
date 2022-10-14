import { MainType } from "../types";

const saveOriginalStyle = (element: HTMLElement) => {
	const allAttributes = new Map<string, string>([["style", ""]]);
	element.getAttributeNames().forEach((attribute) => {
		allAttributes.set(attribute, element.getAttribute(attribute)!);
	});

	return allAttributes;
};

export const fillResets = (
	cssStyleReset: WeakMap<HTMLElement, Map<string, string>>,
	mainElements: MainType
) => {
	new Set(mainElements.flat()).forEach((element) =>
		cssStyleReset.set(element, saveOriginalStyle(element))
	);
};
