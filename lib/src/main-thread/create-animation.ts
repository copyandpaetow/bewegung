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

	wrapperElement.appendChild(element);

	if (nextSibling) {
		parentElement.insertBefore(wrapperElement, nextSibling);
		return;
	}
	parentElement.appendChild(wrapperElement);
};

const createImagePlaceholder = (element: HTMLElement) => {
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;
	const key = element.dataset.bewegungsKey!;

	const placeholderElement = document.createElement("img");
	element.getAttributeNames().forEach((attribute) => {
		placeholderElement.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholderElement.src = emptyImageSrc;
	placeholderElement.dataset.bewegungsReplace = key;
	placeholderElement.dataset.bewegungsRemovable = "";

	nextSibling
		? parentElement.insertBefore(placeholderElement, nextSibling)
		: parentElement.appendChild(placeholderElement);
};

const readdRemovedNodes = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

const setDefaultAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: KeyframeEffectOptions
) => {
	results.keyframeStore.forEach((keyframes, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));

		if (results.overrideStore.has(key)) {
			element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
			applyCSSStyles(element, results.overrideStore.get(key)!);
		}
	});
};

const setImageAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: KeyframeEffectOptions
) => {
	console.log(structuredClone(results));
	results.imageKeyframeStore.forEach((keyframes, key, store) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));

		const wrapperKeyframes = store.get(`${key}-wrapper`)!;
		const wrapperOverrides = results.overrideStore.get(`${key}-wrapper`)!;

		const wrapperElement = createWrapperElement(wrapperOverrides!);

		animations.set(
			`${key}-wrapper`,
			new Animation(new KeyframeEffect(wrapperElement, wrapperKeyframes, options))
		);

		createImagePlaceholder(element);
		createImageWrapperCallback(element, wrapperElement);

		store.delete(key);
		store.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-wrapper`);
	});
};

const applyOverrides = (
	element: HTMLElement,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const key = element.dataset.bewegungsKey;
	if (!key || !overrideStore.has(key)) {
		return;
	}

	element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
	applyCSSStyles(element, overrideStore.get(key)!);
	overrideStore.delete(key);
};

export const create = (options: NormalizedOptions, worker: AtomicWorker) =>
	new Promise<Map<string, Animation>>(async (resolve, reject) => {
		const animations = new Map<string, Animation>();
		const resultWorker = worker(`animationData-${options.key}`);

		resultWorker.onMessage(async (result) => {
			const animationOptions = extractAnimationOptions(options);
			const observerCallback: MutationCallback = (entries, observer) => {
				observer.disconnect();

				//TODO: this could maybe split into element additions/removals and style updates
				iterateRemovedElements(entries, (element, entry) => {
					applyOverrides(element, result.overrideStore);
					readdRemovedNodes(element, entry);
				});
				iterateAddedElements(entries, (element, index) => {
					addKeyToNewlyAddedElement(element, index);
					applyOverrides(element, result.overrideStore);
				});

				setDefaultAnimations(result, animations, animationOptions);
				setImageAnimations(result, animations, animationOptions);

				resolve(animations);
			};

			await nextRaf();
			observe(new MutationObserver(observerCallback));
			options.from?.();
			options.to?.();
		});

		resultWorker.onError(reject);
	});
