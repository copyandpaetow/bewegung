import { AtomicWorker, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, nextRaf } from "../utils/helper";
import { extractAnimationOptions } from "./normalize-props";
import { addKeyToNewlyAddedElement, getNextElementSibling } from "./observe-dom";
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

		createImagePlaceholder(element, placeholderOverrides);
		createImageWrapperCallback(element, wrapperElement);

		store.delete(key);
		store.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-placeholder`);
	});
};

const setOverrides = (overrideStore: Map<string, Partial<CSSStyleDeclaration>>) => {
	const overrideCallbacks: VoidFunction[] = [];

	overrideStore.forEach((overrides, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
		applyCSSStyles(element, overrides);
	});
	return overrideCallbacks;
};

export const create = (options: NormalizedOptions, worker: AtomicWorker) =>
	new Promise<Map<string, Animation>>((resolve, reject) => {
		const animations = new Map<string, Animation>();
		const animationOptions = extractAnimationOptions(options);
		const resultWorker = worker(`animationData-${options.key}`);

		resultWorker.onMessage(async (result) => {
			const observerCallback: MutationCallback = (entries, observer) => {
				observer.disconnect();

				//TODO: this could maybe split into element additions/removals and style updates
				iterateRemovedElements(entries, readdRemovedNodes);
				iterateAddedElements(entries, addKeyToNewlyAddedElement);

				setDefaultAnimations(result.keyframeStore, animations, animationOptions);
				setImageAnimations(result, animations, animationOptions);
				setOverrides(result.overrideStore);

				resolve(animations);
			};

			await nextRaf();
			observe(new MutationObserver(observerCallback));
			options.from?.();
			options.to?.();
		});

		resultWorker.onError(reject);
	});
