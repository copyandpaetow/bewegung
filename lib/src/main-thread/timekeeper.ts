import { AtomicWorker, NormalizedOptions } from "../types";
import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";

const removeElements = () => {
	querySelectorAll(`[${Attributes.removable}]`).forEach((element) => {
		element.remove();
	});
};

const removeDataAttributes = () => {
	querySelectorAll(`[${Attributes.key}*='_']`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

const restoreOverridenElements = () => {
	querySelectorAll(`[${Attributes.cssReset}]`).forEach((element) => {
		element.style.cssText = element.dataset.bewegungsCssReset ?? "";
	});
};

export const createTimekeeper = (options: NormalizedOptions[], worker: AtomicWorker): Animation => {
	const timekeeper = new Animation(new KeyframeEffect(null, null, options[0].totalRuntime));

	const cleanup = async () => {
		worker("terminate").cleanup();
		await nextRaf();
		restoreOverridenElements();
		removeElements();
		removeDataAttributes();
	};

	timekeeper.addEventListener("cancel", cleanup);
	timekeeper.addEventListener("finish", cleanup);

	return timekeeper;
};
