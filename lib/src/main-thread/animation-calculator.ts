import { AtomicWorker, NormalizedOptions } from "../types";
import { Attributes } from "../utils/constants";
import { execute, nextRaf, querySelectorAll } from "../utils/helper";
import { createAnimations, interceptDom } from "./create-animation";
import { recordDomLabels } from "./label-elements";
import { observeDom } from "./observe-dom";
import { getElementResets } from "./resets";

const replaceImagePlaceholders = () => {
	querySelectorAll(`[${Attributes.replace}]`).forEach((element) => {
		const replaceKey = element.dataset.bewegungsReplace!;
		const replaceElement = document.querySelector(`[${Attributes.key}=${replaceKey}]`)!;
		const parent = element.parentElement!;

		parent.replaceChild(replaceElement, element);
		element.remove();
	});
};

const restoreElements = async (resetPromise: Promise<Map<HTMLElement, Map<string, string>>>) => {
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
}): Promise<Map<string, Animation>> => {
	const { options, timekeeper, worker } = props;
	const startAnimation = new Animation(new KeyframeEffect(null, null, options.delay));
	const animations = new Map([
		["timekeeper", timekeeper],
		["start", startAnimation],
	]);

	try {
		recordDomLabels(options.root);
		await observeDom(options, worker);
		const resets = getElementResets();

		await worker("animationData").onMessage((result) => {
			const onStartCallbacks = createAnimations(result, animations, options);

			interceptDom(startAnimation, options, () => {
				const onAddedStartCallbacks = createAnimations(result, animations, options);
				onStartCallbacks.forEach(execute);
				onAddedStartCallbacks.forEach(execute);
			});
		});

		timekeeper.oncancel = async () => {
			restoreElements(resets);
		};
		timekeeper.onfinish = () => {
			requestAnimationFrame(() => {
				replaceImagePlaceholders();
				removeElements();
				removeDataAttributes();
			});
		};
	} catch (error) {
		console.error("something weird happend: ", error);
		startAnimation.onfinish = () => {
			options.from?.();
			options.to?.();
		};
	} finally {
		return animations;
	}
};
