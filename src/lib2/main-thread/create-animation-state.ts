import { AnimationState, AtomicWorker, ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, nextRaf, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import {
	addKeyToCustomElements,
	observeDom,
	readdRemovedNodes,
	separateEntries,
} from "./observe-dom";

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

const setElementAnimation = (
	element: HTMLElement,
	result: ResultTransferable,
	animations: Map<string, Animation>,
	onStart: Map<string, VoidFunction>,
	totalRuntime: number
) => {
	const key = element.dataset.bewegungsKey ?? "";
	const keyframes = result.keyframes.get(key) ?? [];
	const overrides = result.overrides.get(key);
	if (!keyframes.length && !overrides) {
		return;
	}

	const anim = new Animation(new KeyframeEffect(element, keyframes, totalRuntime));
	animations.set(key, anim);

	if (element.tagName === "IMG" && result.keyframes.has(`${key}-wrapper`)) {
		const parentElement = element.parentElement!;
		const nextSibling = element.nextElementSibling;

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

		placeholderAnimation.onfinish = () => {
			parentElement.replaceChild(element, placeholderElement);
		};
		wrapperAnimation.onfinish = () => {
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
	}

	if (!overrides) {
		anim.onfinish = () => {
			if (element.dataset.bewegungsRemoveable) {
				element.remove();
			}
		};
		return;
	}
	onStart.set(key, () => {
		element.dataset.bewegungsCssText = element.style.cssText;
		applyCSSStyles(element, overrides);
	});
	anim.onfinish = () => {
		if (element.dataset.bewegungsRemoveable) {
			element.remove();
		}
		element.style.cssText = element.dataset.bewegungsCssText!;
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

export const setAnimations = async (
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

			addEntries.forEach((mutationRecord) => {
				mutationRecord.addedNodes.forEach((node) => {
					if (!isHTMLElement(node)) {
						return;
					}
					setElementAnimation(node as HTMLElement, result, animations, onStart, totalRuntime);
				});
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

const getElementResets = () => {
	const resets = new Map<HTMLElement, Map<string, string>>();
	requestAnimationFrame(() => {
		querySelectorAll(`[${Attributes.reset}]`).forEach((element) => {
			resets.set(element, saveOriginalStyle(element));
		});
	});

	return resets;
};

export const createAnimationState = async (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	worker: AtomicWorker
): Promise<AnimationState> => {
	await observeDom(callbacks, worker);
	const elementResets = getElementResets();

	const result = (await worker("animationData").onMessage((result) => {
		return result;
	})) as ResultTransferable;
	const animations = await setAnimations(result, callbacks, totalRuntime);

	return { animations, elementResets };
};
