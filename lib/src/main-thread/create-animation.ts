import { NormalizedOptions, ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import {
	applyCSSStyles,
	iterateAddedElements,
	iterateRemovedElements,
	nextRaf,
	observe,
} from "../utils/helper";
import { extractAnimationOptions } from "./normalize-props";
import { addKeyToNewlyAddedElement, getNextElementSibling } from "./observe-dom";

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

export const createAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: NormalizedOptions
) => {
	const animationOptions: KeyframeEffectOptions = {
		...extractAnimationOptions(options),
		fill: "both",
	};

	const onStart: VoidFunction[] = [];

	results.keyframeStore.forEach((keyframes, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, animationOptions)));
		results.keyframeStore.delete(key);
	});

	results.imageKeyframeStore.forEach((keyframes, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, animationOptions)));

		const wrapperKeyframes = results.imageKeyframeStore.get(`${key}-wrapper`)!;
		const wrapperOverrides = results.overrideStore.get(`${key}-wrapper`)!;
		const placeholderOverrides = results.overrideStore.get(`${key}-placeholder`)!;

		const wrapperElement = createWrapperElement(wrapperOverrides!);

		animations.set(
			`${key}-wrapper`,
			new Animation(new KeyframeEffect(wrapperElement, wrapperKeyframes, animationOptions))
		);

		onStart.push(
			createImagePlaceholder(element, placeholderOverrides),
			createImageWrapperCallback(element, wrapperElement)
		);

		results.imageKeyframeStore.delete(key);
		results.imageKeyframeStore.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-wrapper`);
		results.overrideStore.delete(`${key}-placeholder`);
	});

	results.overrideStore.forEach((overrides, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		onStart.push(() => {
			element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
			applyCSSStyles(element, overrides);
		});
		results.overrideStore.delete(key);
	});

	return onStart;
};

export const interceptDom = (
	startAnimation: Animation,
	options: NormalizedOptions,
	onFinish: VoidFunction
) => {
	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		iterateRemovedElements(entries, readdRemovedNodes);
		iterateAddedElements(entries, addKeyToNewlyAddedElement);
		onFinish();
	};

	startAnimation.onfinish = async () => {
		await nextRaf();
		observe(new MutationObserver(observerCallback));
		options.from?.();
		options.to?.();
	};
};
