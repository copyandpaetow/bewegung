import { createAnimations } from "./default/animations";
import { createImageAnimations } from "./images/animations";
import {
	observeDom,
	readdRemovedNodes,
	registerElementAdditons,
	separateEntries,
} from "./observe-dom";
import { AnimationState, DefaultResult, ImageResult, MainState } from "./types";
import { applyCSSStyles, emptyStyleReset } from "./utils/helper";

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

const resultState = (state: MainState) => {
	const { worker } = state;
	const imageWorker = worker("imageResults");
	const imagePromise = imageWorker.onMessage((resultTransferable) => {
		imageWorker.cleanup();
		return createImageAnimations(resultTransferable, state);
	}) as Promise<ImageResult>;
	const textWorker = worker("textResults");

	const textPromise = textWorker.onMessage((resultTransferable) => {
		textWorker.cleanup();
		return createAnimations(resultTransferable, state);
	}) as Promise<DefaultResult>;
	const defaultWorker = worker("defaultResults");

	const defaultPromise = defaultWorker.onMessage((resultTransferable) => {
		defaultWorker.cleanup();
		return createAnimations(resultTransferable, state);
	}) as Promise<DefaultResult>;

	return Promise.all([defaultPromise, imagePromise, textPromise]);
};

export const createAnimationState = async (state: MainState): Promise<AnimationState> => {
	const { elementTranslations } = state;
	const elementResets = new Map<string, Map<string, string>>();
	await observeDom(state);

	//TODO: we should remember the elements that were the target for change and only save their style
	//? what about override styles? Cleanup needs to be on point then
	requestAnimationFrame(() => {
		elementTranslations.forEach((domElement, key) => {
			elementResets.set(key, saveOriginalStyle(domElement));
		});
	});

	const result = await resultState(state);
	console.log(result);
	const animations = await setOnPlayObserver(result, state);

	return Object.freeze({
		animations,
		elementResets,
	});
};

const getDefaultAdditionAnimations = (
	addedElements: HTMLElement[],
	result: DefaultResult,
	state: MainState
) => {
	const { partialElements, overrides } = result;
	const { elementTranslations, totalRuntime } = state;
	const animations = new Map<string, Animation>();

	addedElements
		.filter((element) => partialElements.has(elementTranslations.get(element)!))
		.forEach((element) => {
			const key = elementTranslations.get(element)!;
			const keyframe = partialElements.get(key)!;
			const override = overrides.get(key)!;
			const animation = new Animation(new KeyframeEffect(element, keyframe, totalRuntime));
			applyCSSStyles(element, override);
			const reset = emptyStyleReset(override);

			animation.onfinish = () => applyCSSStyles(element, reset);

			animations.set(key, animation);
		});
	return animations;
};

const getDefaultRemovalAnimations = (
	removeElements: HTMLElement[],
	result: DefaultResult,
	state: MainState
) => {
	const { partialElements, overrides } = result;
	const { elementTranslations, totalRuntime } = state;
	const animations = new Map<string, Animation>();

	removeElements
		.filter((element) => elementTranslations.get(element as HTMLElement))
		.forEach((element) => {
			const key = elementTranslations.get(element)!;
			const override = overrides.get(key)!;
			const keyframe = partialElements.get(key)!;
			const animation = new Animation(new KeyframeEffect(element, keyframe, totalRuntime));
			applyCSSStyles(element, override);

			animation.onfinish = () => element.remove();
			animations.set(key, animation);
		});
	return animations;
};

export const setOnPlayObserver = (
	result: [DefaultResult, ImageResult, DefaultResult],
	state: MainState
): Promise<Map<string, Animation>> =>
	new Promise<Map<string, Animation>>((resolve) => {
		const { callbacks } = state;
		const [defaultResult] = result;

		const animations = new Map<string, Animation>(
			result.flatMap((entry) => Array.from(entry.animations))
		);

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { addEntries, removeEntries } = separateEntries(entries);
			const addedElements = registerElementAdditons(addEntries, state);
			const removedElements = readdRemovedNodes(removeEntries);
			const defaultAdditionAnimations = getDefaultAdditionAnimations(
				addedElements,
				defaultResult,
				state
			);
			const defaultRemovalAnimations = getDefaultRemovalAnimations(
				removedElements,
				defaultResult,
				state
			);

			//TODO: handle image removal
			//TODO: handle text removal

			result.flatMap((entry) => entry.onStart).forEach((cb) => cb());
			resolve(new Map([...animations, ...defaultAdditionAnimations, ...defaultRemovalAnimations]));
		};
		const observer = new MutationObserver(observerCallback);
		observer.observe(document.body, { childList: true, subtree: true, attributes: true });
		requestAnimationFrame(() => {
			callbacks.get(1)!.forEach((cb) => cb());
		});
	});
