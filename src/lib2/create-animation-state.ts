import { observeDom, readdRemovedNodes, separateEntries } from "./observe-dom";
import {
	AnimationState,
	AtomicWorker,
	ClientAnimationTree,
	InternalState,
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

const overrideElementStyles = (element: HTMLElement, override: Partial<CSSStyleDeclaration>) => {
	applyCSSStyles(element, override);
};

const createAnimationTree = (
	tree: ResultingDomTree,
	element: HTMLElement,
	totalRuntime: number
): ClientAnimationTree => {
	const elementChildren = Array.from(element.children) as HTMLElement[];
	const animation = new Animation(new KeyframeEffect(element, tree.keyframes, totalRuntime));

	overrideElementStyles(element, tree.overrides);

	//it would make sense for images to return a new tree entry from the override
	//either we allow the element to add something to the parents children, or we would need to iterate the children before

	return {
		animation,
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
			const { removeEntries } = separateEntries(entries);
			readdRemovedNodes(removeEntries);

			result.forEach((animationTree, key) => {
				const rootElement = state.roots.get(key)!;

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
