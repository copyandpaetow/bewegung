import {
	addKeyToCustomElements,
	observeDom,
	readdRemovedNodes,
	separateEntries,
} from "./observe-dom";
import {
	AnimationState,
	AtomicWorker,
	Attributes,
	ClientAnimationTree,
	Overrides,
	ResultingDomTree,
} from "./types";
import { emptyImageSrc } from "./utils/constants";
import { applyCSSStyles } from "./utils/helper";

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

	if (element.hasAttribute("bewegung-removeable")) {
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

	const placeholderElement = document.createElement("img");
	placeholderElement.src = emptyImageSrc;
	placeholderElement.className = element.className;

	applyCSSStyles(placeholderElement, placeholder.style);
	const placeholderAnimation = new Animation(
		new KeyframeEffect(placeholderElement, [], totalRuntime)
	);

	placeholderAnimation.onfinish = () => {
		parentElement.replaceChild(element, placeholderElement);
	};
	const wrapperElement = document.createElement("div");
	applyCSSStyles(wrapperElement, wrapper.style);
	const wrapperAnimation = new Animation(
		new KeyframeEffect(wrapperElement, wrapper.keyframes, totalRuntime)
	);

	wrapperAnimation.onfinish = () => {
		//this needs to happen after the mainElement was swapped out again
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
	const elementChildren = Array.from(element.children) as HTMLElement[];
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

export const createAnimationState = async (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	worker: AtomicWorker
): Promise<AnimationState> => {
	const elementResets = new Map<HTMLElement, Map<string, string>>();
	await observeDom(callbacks, worker);
	requestAnimationFrame(() => {
		Array.from(document.querySelectorAll("[data-bewegungs-reset]")).forEach((element) => {
			elementResets.set(element as HTMLElement, saveOriginalStyle(element as HTMLElement));
		});
	});

	const result = (await worker("animationTrees").onMessage(
		(animationTrees) => animationTrees
	)) as Map<string, ResultingDomTree>;
	const animations = await setOnPlayObserver(result, callbacks, totalRuntime);

	return { animations, elementResets };
};
