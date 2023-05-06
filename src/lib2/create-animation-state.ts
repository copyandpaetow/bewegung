import {
	addKeyToCustomElements,
	observeDom,
	readdRemovedNodes,
	separateEntries,
} from "./observe-dom";
import {
	AtomicWorker,
	ClientAnimationTree,
	InternalState,
	Overrides,
	ResultingDomTree,
} from "./types";
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

	//TODO: remove
	if (true || callbacks.length === 0) {
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

const createAnimationTree = (
	tree: ResultingDomTree,
	element: HTMLElement,
	totalRuntime: number
): ClientAnimationTree => {
	const elementChildren = Array.from(element.children) as HTMLElement[];

	if (tree.key.includes("UL-3")) {
		console.log(elementChildren, tree.children);
	}

	return {
		key: tree.key,
		animation: getAnimation(tree, element, totalRuntime),
		children: tree.children.map((child, index) =>
			createAnimationTree(child, elementChildren[index], totalRuntime)
		),
	};
};

export const setOnPlayObserver = (
	result: Map<string, ResultingDomTree>,
	state: InternalState
): Promise<Map<string, ClientAnimationTree>> =>
	new Promise<Map<string, ClientAnimationTree>>((resolve) => {
		const { callbacks, totalRuntime } = state;
		const animationTrees = new Map<string, ClientAnimationTree>();

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { removeEntries, addEntries } = separateEntries(entries);
			readdRemovedNodes(removeEntries);
			addKeyToCustomElements(addEntries);

			result.forEach((animationTree, key) => {
				const rootElement = state.roots.get(key)!;

				animationTrees.set(key, createAnimationTree(animationTree, rootElement, totalRuntime));
			});
			console.log(animationTrees);

			resolve(animationTrees);
		};
		const observer = new MutationObserver(observerCallback);
		observer.observe(document.body, { childList: true, subtree: true, attributes: true });
		requestAnimationFrame(() => {
			callbacks.get(1)!.forEach((cb) => cb());
		});
	});

export const createAnimationState = async (
	state: InternalState,
	worker: AtomicWorker
): Promise<Map<string, ClientAnimationTree>> => {
	const elementResets = new Map<string, Map<string, string>>();
	await observeDom(state, worker);

	const result = (await worker("animationTrees").onMessage(
		(animationTrees) => animationTrees
	)) as Map<string, ResultingDomTree>;
	const animations = await setOnPlayObserver(result, state);

	return animations;
};
