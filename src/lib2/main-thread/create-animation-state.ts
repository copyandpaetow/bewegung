import {
	addKeyToCustomElements,
	observeDom,
	readdRemovedNodes,
	separateEntries,
} from "./observe-dom";
import {
	AnimationState,
	AtomicWorker,
	ClientAnimationTree,
	Overrides,
	ResultingDomTree,
} from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, getChilden, querySelectorAll } from "../utils/helper";

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

export const setOnPlayObserver = (
	result: Map<string, ResultingDomTree>,
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number
): Promise<Map<string, ClientAnimationTree>> =>
	new Promise<Map<string, ClientAnimationTree>>((resolve) => {
		const animationTrees = new Map<string, ClientAnimationTree>();
		console.log(result);

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { removeEntries, addEntries } = separateEntries(entries);
			readdRemovedNodes(removeEntries);
			addKeyToCustomElements(addEntries);

			result.forEach((animationTree, key) => {
				const rootElement = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;

				animationTrees.set(key, createAnimationTree(animationTree, rootElement, totalRuntime));
			});
			resolve(animationTrees);
		};
		const observer = new MutationObserver(observerCallback);
		observer.observe(document.body, { childList: true, subtree: true, attributes: true });
		requestAnimationFrame(() => {
			callbacks.get(1)!.forEach((cb) => cb());
		});
	});

const saveElementStyle = () => {
	const elementResets = new Map<HTMLElement, Map<string, string>>();
	requestAnimationFrame(() => {
		querySelectorAll(`[${Attributes.reset}]`).forEach((element) => {
			elementResets.set(element, saveOriginalStyle(element));
		});
	});

	return elementResets;
};

/*
- changing the dom, creating the animations, applying override styles, and adding elements creates a lot of stress for the dom

- the big problem is: only when we call the user callbacks we got the right dom tree
=> before there could be elements missing

- we can create some animations beforehand but it doesnt really decrease the style work for the browser

- maybe a tree is not the best return type from the worker
=> we could return some maps for keyframes, overrides etc


```
* create animations beforehand?
requestAnimationFrame(() => {
			* add onStart-Callbacks (element creation, overrides styles to apply) etc here
			observer.observe(document.body, { childList: true, subtree: true, attributes: true });
			callbacks.get(1)!.forEach((cb) => cb());
		});

		```
in the callback, we would only need to do the work for the added elements

*/

export const createAnimationState = async (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	worker: AtomicWorker
): Promise<AnimationState> => {
	await observeDom(callbacks, worker);
	const elementResets = saveElementStyle();

	const result = (await worker("animationTrees").onMessage(
		(animationTrees) => animationTrees
	)) as Map<string, ResultingDomTree>;
	const animations = await setOnPlayObserver(result, callbacks, totalRuntime);

	return { animations, elementResets };
};
