import {
	addKeyToCustomElements,
	observeDom,
	readdRemovedNodes,
	separateEntries,
} from "./observe-dom";
import {
	AnimationData,
	AnimationState,
	AtomicWorker,
	ClientAnimationTree,
	Overrides,
	ResultTransferable,
	ResultingDomTree,
} from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, getChilden, nextRaf, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";

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

const overrideElementStyles = (element: HTMLElement, override: Overrides) => {
	const callbacks: VoidFunction[] = [];

	if (override.styles) {
		const style = element.style.cssText;
		applyCSSStyles(element, override.styles);
		callbacks.push(() => (element.style.cssText = style));
	}

	if (element.dataset.bewegungsRemoveable) {
		callbacks.length = 0;
		callbacks.push(() => element.remove());
	}

	if (callbacks.length === 0) {
		return null;
	}

	return () => callbacks.forEach((cb) => cb());
};

const getAnimation = (tree: ResultingDomTree, element: HTMLElement, totalRuntime: number) => {
	if (tree.keyframes.length === 0 && !tree.overrides.styles) {
		return null;
	}

	const animation = new Animation(new KeyframeEffect(element, tree.keyframes, totalRuntime));
	const resetOverrides = overrideElementStyles(element, tree.overrides);

	if (resetOverrides) {
		animation.onfinish = resetOverrides;
	}

	return animation;
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

const getOverrideAnimations = (
	tree: ResultingDomTree,
	element: HTMLElement,
	totalRuntime: number
): ClientAnimationTree[] => {
	const { wrapper, placeholder } = tree.overrides;
	if (!wrapper || !placeholder) {
		return [];
	}
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;

	const placeholderElement = createPlaceholder(element, placeholder.style);
	const wrapperElement = createWrapperElement(wrapper.style);

	const placeholderAnimation = new Animation(
		new KeyframeEffect(placeholderElement, [], totalRuntime)
	);
	const wrapperAnimation = new Animation(
		new KeyframeEffect(wrapperElement, wrapper.keyframes, totalRuntime)
	);

	placeholderAnimation.onfinish = () => {
		parentElement.replaceChild(element, placeholderElement);
	};
	wrapperAnimation.onfinish = () => {
		wrapperElement.remove();
	};

	parentElement.appendChild(wrapperElement).appendChild(element);
	nextSibling
		? parentElement.insertBefore(placeholderElement, nextSibling)
		: parentElement.appendChild(placeholderElement);

	return [
		{ key: `${tree.key}-placeholder`, animation: placeholderAnimation, children: [] },
		{ key: `${tree.key}-wrapper`, animation: wrapperAnimation, children: [] },
	];
};

const createAnimationTree = (
	tree: ResultingDomTree,
	element: HTMLElement,
	totalRuntime: number
): ClientAnimationTree => {
	const elementChildren = getChilden(element);
	const overrideAnimations = getOverrideAnimations(tree, element, totalRuntime);

	const animationTree = {
		key: tree.key,
		animation: getAnimation(tree, element, totalRuntime),
		children: tree.children
			.map((child, index) => createAnimationTree(child, elementChildren[index], totalRuntime))
			.concat(overrideAnimations),
	};

	return animationTree;
};

const setAnimations = (
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
	element.dataset.bewegungsCssText = element.style.cssText;
	onStart.set(key, () => {
		applyCSSStyles(element, overrides);
	});
	anim.onfinish = () => {
		if (element.dataset.bewegungsRemoveable) {
			element.remove();
		}
		element.style.cssText = element.dataset.bewegungsCssText!;
	};
};

export const setOnPlayObserver = async (
	result: ResultTransferable,
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number
): Promise<Map<string, Animation>> => {
	const animations = new Map<string, Animation>();
	const onStart = new Map<string, VoidFunction>();

	result.keyframes.forEach((_, key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}
		setAnimations(element, result, animations, onStart, totalRuntime);
	});
	await nextRaf();

	return new Promise<Map<string, Animation>>((resolve) => {
		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { removeEntries, addEntries } = separateEntries(entries);
			readdRemovedNodes(removeEntries);
			addKeyToCustomElements(addEntries);
			const onStartInner = new Map<string, VoidFunction>();

			addEntries.forEach((mutationRecord) => {
				mutationRecord.addedNodes.forEach((node) => {
					if (!isHTMLElement(node)) {
						return;
					}
					setAnimations(node as HTMLElement, result, animations, onStartInner, totalRuntime);
				});
			});
			onStartInner.forEach((cb, key) => {
				cb();
				console.log(key);
			});
			resolve(animations);
		};
		const observer = new MutationObserver(observerCallback);
		requestAnimationFrame(() => {
			onStart.forEach((cb) => {
				cb();
			});
			if (result.flags.size) {
				observer.observe(document.body, { childList: true, subtree: true, attributes: true });
				callbacks.get(1)!.forEach((cb) => cb());
				return;
			}

			callbacks.get(1)!.forEach((cb) => cb());
			resolve(animations);
		});
	});
};

const saveElementStyle = () => {
	const elementResets = new Map<HTMLElement, Map<string, string>>();
	requestAnimationFrame(() => {
		querySelectorAll(`[${Attributes.reset}]`).forEach((element) => {
			elementResets.set(element, saveOriginalStyle(element));
		});
	});

	return elementResets;
};

export const createAnimationState = async (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	worker: AtomicWorker
): Promise<AnimationState> => {
	await observeDom(callbacks, worker);
	const elementResets = saveElementStyle();

	const result = (await worker("animationTrees").onMessage((result) => {
		return result;
	})) as ResultTransferable;
	const animations = await setOnPlayObserver(result, callbacks, totalRuntime);

	return { animations, elementResets };
};
