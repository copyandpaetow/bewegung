import { Attributes } from "../utils/constants";
import { querySelectorAll } from "../utils/helper";

const saveOriginalStyle = (element: HTMLElement) => {
	const attributes = new Map<string, string>();

	element.getAttributeNames().forEach((attribute) => {
		attributes.set(attribute, element.getAttribute(attribute)!);
	});
	if (!attributes.has("style")) {
		attributes.set("style", element.style.cssText);
	}

	return attributes;
};

export const getElementResets = () =>
	new Promise<Map<HTMLElement, Map<string, string>>>((resolve) => {
		const resets = new Map<HTMLElement, Map<string, string>>();
		requestAnimationFrame(() => {
			querySelectorAll(`[${Attributes.reset}]`).forEach((element) => {
				resets.set(element, saveOriginalStyle(element));
			});
			resolve(resets);
		});
	});
