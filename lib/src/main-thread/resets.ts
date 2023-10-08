import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";

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

//TODO: these are currently not in use
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

export const removeElements = () => {
	querySelectorAll(`[${Attributes.removable}]`).forEach((element) => {
		element.remove();
	});
};

export const removeDataAttributes = () => {
	querySelectorAll(`[${Attributes.key}*='_']`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

export const restoreOverridenElements = () => {
	querySelectorAll(`[${Attributes.cssReset}]`).forEach((element) => {
		element.style.cssText = element.dataset.bewegungsCssReset ?? "";
	});
};

export const cleanup = async () => {
	await nextRaf();
	restoreOverridenElements();
	removeElements();
	removeDataAttributes();
};
