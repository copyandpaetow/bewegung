import { AtomicWorker, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, execute, nextRaf } from "../utils/helper";
import { extractAnimationOptions } from "./normalize-props";
import {
	addKeyToNewlyAddedElement,
	getNextElementSibling,
	getRunningAnimations,
} from "./observe-dom";
import { iterateAddedElements, iterateRemovedElements, observe } from "./observer-helper";

const createWrapperElement = (style: Partial<CSSStyleDeclaration>) => {
	const wrapperElement = document.createElement("div");
	applyCSSStyles(wrapperElement, style);
	wrapperElement.dataset.bewegungsRemovable = "";

	return wrapperElement;
};

const createImageWrapperCallback = (element: HTMLElement, wrapperElement: HTMLElement) => {
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;

	return () => {
		nextSibling
			? parentElement.insertBefore(wrapperElement.appendChild(element), nextSibling)
			: parentElement.appendChild(wrapperElement).appendChild(element);
	};
};

const createImagePlaceholder = (
	element: HTMLElement,
	overrideStyle: Partial<CSSStyleDeclaration>
) => {
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;
	const key = element.dataset.bewegungsKey!;

	const placeholderElement = document.createElement("img");
	element.getAttributeNames().forEach((attribute) => {
		placeholderElement.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholderElement.src = emptyImageSrc;

	applyCSSStyles(placeholderElement, overrideStyle);
	placeholderElement.dataset.bewegungsReplace = key;
	placeholderElement.dataset.bewegungsRemovable = "";

	return () => {
		nextSibling
			? parentElement.insertBefore(placeholderElement, nextSibling)
			: parentElement.appendChild(placeholderElement);
	};
};

const readdRemovedNodes = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

const setDefaultAnimations = (
	keyframeStore: Map<string, Keyframe[]>,
	animations: Map<string, Animation>,
	options: KeyframeEffectOptions
) => {
	keyframeStore.forEach((keyframes, key, store) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));
		store.delete(key);
	});
};

const setImageAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: KeyframeEffectOptions
) => {
	const imageCallbacks: VoidFunction[] = [];

	results.imageKeyframeStore.forEach((keyframes, key, store) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));

		const wrapperKeyframes = store.get(`${key}-wrapper`)!;
		const wrapperOverrides = results.overrideStore.get(`${key}-wrapper`)!;
		const placeholderOverrides = results.overrideStore.get(`${key}-placeholder`)!;

		const wrapperElement = createWrapperElement(wrapperOverrides!);

		animations.set(
			`${key}-wrapper`,
			new Animation(new KeyframeEffect(wrapperElement, wrapperKeyframes, options))
		);

		imageCallbacks.push(
			createImagePlaceholder(element, placeholderOverrides),
			createImageWrapperCallback(element, wrapperElement)
		);

		store.delete(key);
		store.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-placeholder`);
	});

	return imageCallbacks;
};

const setOverrides = (overrideStore: Map<string, Partial<CSSStyleDeclaration>>) => {
	const overrideCallbacks: VoidFunction[] = [];

	overrideStore.forEach((overrides, key, store) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		overrideCallbacks.push(() => {
			element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
			applyCSSStyles(element, overrides);
		});
		store.delete(key);
	});
	return overrideCallbacks;
};

export const createAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: NormalizedOptions
) => {
	const animationOptions: KeyframeEffectOptions = {
		...extractAnimationOptions(options),
		fill: "both",
		composite: "accumulate",
	};

	setDefaultAnimations(results.keyframeStore, animations, animationOptions);
	const overrideCallbacks = setOverrides(results.overrideStore);
	const imageCallbacks = setImageAnimations(results, animations, animationOptions);

	return [...overrideCallbacks, ...imageCallbacks];
};

export const create = async (options: NormalizedOptions, worker: AtomicWorker) =>
	new Promise<Map<string, Animation>>((resolve, reject) => {
		const animations = new Map<string, Animation>();
		const runningAnimations: Animation[] = [];
		const resultWorker = worker(`animationData-${options.key}`);
		resultWorker.onMessage(async (result) => {
			resultWorker.cleanup();
			const onStartCallbacks = createAnimations(result, animations, options);

			const observerCallback: MutationCallback = (entries, observer) => {
				observer.disconnect();
				runningAnimations.forEach((anim) => anim.pause());

				iterateRemovedElements(entries, readdRemovedNodes);
				iterateAddedElements(entries, addKeyToNewlyAddedElement);

				onStartCallbacks.forEach(execute);
				createAnimations(result, animations, options).forEach(execute);
				runningAnimations.forEach((anim) => anim.play());

				resolve(animations);
			};

			getRunningAnimations(options.root, runningAnimations);
			await nextRaf();
			observe(new MutationObserver(observerCallback));
			options.from?.();
			options.to?.();
		});

		resultWorker.onError(reject);
	});
