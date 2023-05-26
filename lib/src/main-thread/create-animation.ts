import { ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, nextRaf, querySelectorAll } from "../utils/helper";
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
	placeholderElement.src = emptyImageSrc;

	element.getAttributeNames().forEach((attribute) => {
		placeholderElement.setAttribute(attribute, element.getAttribute(attribute)!);
	});

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
		result.overrides.get(`${key}-placeholder`)!
	);
	const wrapperElement = createWrapperElement(result.overrides.get(`${key}-wrapper`)!);
	const placeholderAnimation = new Animation(
		new KeyframeEffect(placeholderElement, [], totalRuntime)
	);
	const wrapperAnimation = new Animation(
		new KeyframeEffect(wrapperElement, result.keyframes.get(`${key}-wrapper`)!, totalRuntime)
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
	result: ResultTransferable,
	animations: Map<string, Animation>,
	onStart: Map<string, VoidFunction>,
	totalRuntime: number
) => {
	const key = element.dataset.bewegungsKey!;
	const keyframes = result.keyframes.get(key) ?? [];
	const overrides = result.overrides.get(key);

	if (!keyframes.length && !overrides) {
		return;
	}

	const anim = new Animation(new KeyframeEffect(element, keyframes, totalRuntime));
	animations.set(key, anim);

	if (element.tagName === "IMG" && result.keyframes.has(`${key}-wrapper`)) {
		createAdditionalImageElements(element, result, animations, onStart, totalRuntime);
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

const createAnimationsFromExistingElements = (result: ResultTransferable, totalRuntime: number) => {
	const animations = new Map<string, Animation>();
	const onStart = new Map<string, VoidFunction>();

	result.keyframes.forEach((_, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		setElementAnimation(element, result, animations, onStart, totalRuntime);
	});

	return { animations, onStart };
};

export const createAnimations = async (
	result: ResultTransferable,
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number
): Promise<Map<string, Animation>> => {
	const { animations, onStart } = createAnimationsFromExistingElements(result, totalRuntime);
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
					setElementAnimation(node as HTMLElement, result, animations, onStart, totalRuntime);
				});

			onStart.forEach((cb) => cb());
			resolve(animations);
		};
		const observer = new MutationObserver(observerCallback);
		requestAnimationFrame(() => {
			if (result.flags.size) {
				observer.observe(document.body, { childList: true, subtree: true, attributes: true });
				callbacks.get(1)!.forEach((cb) => cb());
				return;
			}

			callbacks.get(1)!.forEach((cb) => cb());
			onStart.forEach((cb) => cb());
			resolve(animations);
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
