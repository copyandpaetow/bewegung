import { AtomicWorker, NormalizedOptions } from "../types";
import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { recordDomLabels } from "./label-elements";
import { observeDom } from "./observe-dom";
import { getElementResets } from "./resets";

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

export const read = async (options: NormalizedOptions, worker: AtomicWorker) => {
	try {
		recordDomLabels(options.root);
		await nextRaf();
		await observeDom(options, worker);
		return getElementResets();
	} catch (error) {
		options.from?.();
		options.to?.();
		return new Map<HTMLElement, Map<string, string>>();
	}
};
