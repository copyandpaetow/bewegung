import { AtomicWorker, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { createAnimations, getElementResets } from "./create-animation";
import { recordDomLabels } from "./label-elements";
import { observeDom } from "./observe-dom";

export const restoreElements = async (resets: Map<HTMLElement, Map<string, string>>) => {
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

const removeElements = () => {
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

export const fetchAnimationData = async (props: {
	options: NormalizedOptions;
	timekeeper: Animation;
	worker: AtomicWorker;
	needsInitalReadout: boolean;
}): Promise<Map<string, Animation>> => {
	const { options, timekeeper, worker, needsInitalReadout } = props;

	try {
		recordDomLabels(options.root);
		await observeDom(options, worker, needsInitalReadout);
		const resets = getElementResets();
		const data = (await worker("animationData").onMessage(
			(result) => result
		)) as ResultTransferable;

		const animations = await createAnimations(data, options);

		timekeeper.oncancel = async () => {
			const awaitedResets = await resets;
			restoreElements(awaitedResets);
		};
		timekeeper.onfinish = () => {
			requestAnimationFrame(() => {
				removeElements();
				removeDataAttributes();
			});
		};

		animations.set("timekeeper", timekeeper);
		return animations;
	} catch (error) {
		console.error("something weird happend: ", error);
		const animations = new Map([["timekeeper", timekeeper]]);
		timekeeper.onfinish = () => {
			options.callback();
		};

		return Promise.resolve(animations);
	}
};
