import { Attributes, NormalizedOptions } from "../types";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { DelayedWorker } from "../utils/worker-messanger";

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

export const createTimekeeper = (
	options: NormalizedOptions[],
	Webworker: DelayedWorker
): Animation => {
	const timekeeper = new Animation(new KeyframeEffect(null, null, options[0].totalRuntime));

	const cleanup = async () => {
		await nextRaf();
		restoreOverridenElements();
		removeElements();
		removeDataAttributes();
		Webworker.refresh();
	};

	timekeeper.addEventListener("cancel", cleanup);
	timekeeper.addEventListener("finish", cleanup);

	return timekeeper;
};
