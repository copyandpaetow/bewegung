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

export const replaceImagePlaceholders = () => {
	querySelectorAll(`[${Attributes.replace}]`).forEach((element) => {
		const replaceKey = element.dataset.bewegungsReplace!;
		const replaceElement = document.querySelector(`[${Attributes.key}=${replaceKey}]`)!;
		const parent = element.parentElement!;

		parent.replaceChild(replaceElement, element);
		element.remove();
	});
};

export const restoreElements = async (
	resetPromise: Promise<Map<HTMLElement, Map<string, string>>>
) => {
	const resets = await resetPromise;
	await nextRaf();
	querySelectorAll(`[${Attributes.removable}], [${Attributes.key}*="added"]`).forEach((element) => {
		resets.delete(element);
		element.remove();
	});

	resets.forEach((attributes, element) => {
		attributes.forEach((value, key) => {
			element.setAttribute(key, value);
		});
	});
};

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
