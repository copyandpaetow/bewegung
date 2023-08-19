import { ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, execute, nextRaf, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { addKeyToCustomElements, readdRemovedNodes, separateEntries } from "./observe-dom";

export const saveOriginalStyle = (element: HTMLElement) => {
	const attributes = new Map<string, string>();

	element.getAttributeNames().forEach((attribute) => {
		attributes.set(attribute, element.getAttribute(attribute)!);
	});
	if (!attributes.has("style")) {
		attributes.set("style", element.style.cssText);
	}

	return attributes;
};

const createPlaceholder = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	const placeholderElement = document.createElement("img");

	element.getAttributeNames().forEach((attribute) => {
		placeholderElement.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholderElement.src = emptyImageSrc;

	applyCSSStyles(placeholderElement, style);

	return placeholderElement;
};

const createWrapperElement = (style: Partial<CSSStyleDeclaration>) => {
	const wrapperElement = document.createElement("div");
	applyCSSStyles(wrapperElement, style);

	return wrapperElement;
};

const createAdditionalImageElements = (
	element: HTMLElement,
	result: ResultTransferable,
	animations: Map<string, Animation>,
	onStart: Map<string, VoidFunction>,
	totalRuntime: number
) => {
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;
	const key = element.dataset.bewegungsKey ?? "";

	const placeholderElement = createPlaceholder(
		element,
		result.overrideStore.get(`${key}-placeholder`)!
	);
	const wrapperElement = createWrapperElement(result.overrideStore.get(`${key}-wrapper`)!);
	const placeholderAnimation = new Animation(
		new KeyframeEffect(placeholderElement, [], totalRuntime)
	);
	const wrapperAnimation = new Animation(
		new KeyframeEffect(wrapperElement, result.keyframeStore.get(`${key}-wrapper`)!, totalRuntime)
	);
	animations.set(`${key}-wrapper`, wrapperAnimation);
	animations.set(`${key}-placeholder`, placeholderAnimation);

	placeholderAnimation.onfinish = placeholderAnimation.oncancel = () => {
		parentElement.replaceChild(element, placeholderElement);
	};
	wrapperAnimation.onfinish = wrapperAnimation.oncancel = () => {
		wrapperElement.remove();
	};

	onStart.set(`${key}-wrapper`, () => {
		nextSibling
			? parentElement.insertBefore(wrapperElement.appendChild(element), nextSibling)
			: parentElement.appendChild(wrapperElement).appendChild(element);
	});
	onStart.set(`${key}-placeholder`, () => {
		nextSibling
			? parentElement.insertBefore(placeholderElement, nextSibling)
			: parentElement.appendChild(placeholderElement);
	});
};

const setElementAnimation = (
	element: HTMLElement,
	results: ResultTransferable,
	animations: Map<string, Animation>,
	onStart: Map<string, VoidFunction>,
	totalRuntime: number
) => {
	const { keyframeStore, overrideStore } = results;
	const key = element.dataset.bewegungsKey!;
	const keyframes = keyframeStore.get(key);
	const overrides = overrideStore.get(key);

	if (!keyframes) {
		return;
	}

	const anim = new Animation(new KeyframeEffect(element, keyframes, totalRuntime));
	animations.set(key, anim);

	if (keyframeStore.has(`${key}-wrapper`)) {
		createAdditionalImageElements(element, results, animations, onStart, totalRuntime);
	}

	if (!overrides) {
		return;
	}
	onStart.set(key, () => {
		element.dataset.bewegungsCssText = element.style.cssText ?? " ";
		applyCSSStyles(element, overrides);
	});
	anim.onfinish = anim.oncancel = () => {
		element.style.cssText = element.dataset.bewegungsCssText ?? " ";
	};
};

const createAnimationsFromExistingElements = (
	results: ResultTransferable,
	totalRuntime: number
) => {
	const animations = new Map<string, Animation>();
	const onStart = new Map<string, VoidFunction>();

	results.keyframeStore.forEach((_, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		setElementAnimation(element, results, animations, onStart, totalRuntime);
	});

	return { animations, onStart };
};

//TODO: we could delay animation that are not in the viewport
export const createAnimations = async (
	results: ResultTransferable,
	callbacks: VoidFunction[],
	totalRuntime: number
): Promise<Map<string, Animation>> => {
	const { animations, onStart } = createAnimationsFromExistingElements(results, totalRuntime);
	await nextRaf();

	return new Promise<Map<string, Animation>>((resolve) => {
		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { removeEntries, addEntries } = separateEntries(entries);
			readdRemovedNodes(removeEntries);
			addKeyToCustomElements(addEntries);

			addEntries
				.flatMap((mutations) => [...mutations.addedNodes])
				.filter(isHTMLElement)
				.forEach((node) => {
					setElementAnimation(node as HTMLElement, results, animations, onStart, totalRuntime);
				});

			onStart.forEach(execute);
			resolve(animations);
		};
		const observer = new MutationObserver(observerCallback);
		requestAnimationFrame(() => {
			observer.observe(document.body, { childList: true, subtree: true, attributes: true });
			callbacks.forEach(execute);
			return;
		});
	});
};

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
