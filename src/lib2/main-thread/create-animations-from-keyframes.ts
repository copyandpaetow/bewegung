import { BidirectionalMap } from "../shared/element-translations";
import { MainState, Result, ResultTransferable } from "../types";
import { fillImplicitKeyframes } from "../worker-thread/normalize-keyframes";
import { applyCSSStyles } from "./apply-styles";
import { setImageAttributes } from "./css-resets";

const getTemporaryElements = (
	resultTransferable: ResultTransferable,
	translation: BidirectionalMap<string, HTMLElement>
) => {
	const { placeholders, wrappers, resultingStyle } = resultTransferable;
	const temporaryElementMap = new Map<string, HTMLElement>();

	placeholders.forEach((placeholderString, elementString) => {
		const relatedElement = translation.get(elementString)!;
		const placeholderElement = document.createElement("img");
		const elementStyle = resultingStyle.get(placeholderString)!;

		applyCSSStyles(placeholderElement, elementStyle);
		setImageAttributes(placeholderElement, relatedElement);
		temporaryElementMap.set(placeholderString, placeholderElement);
		resultingStyle.delete(placeholderString);
	});

	wrappers.forEach((wrapperString) => {
		const wrapperElement = document.createElement("div");
		const elementStyle = resultingStyle.get(wrapperString)!;
		applyCSSStyles(wrapperElement, elementStyle);

		temporaryElementMap.set(wrapperString, wrapperElement);
		resultingStyle.delete(wrapperString);
	});

	return temporaryElementMap;
};

const setWrapperCallbacks = (
	resultTransferable: ResultTransferable,
	result: Result,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { wrappers } = resultTransferable;
	const { animations, onStart } = result;
	const { translation, root } = state;

	wrappers.forEach((wrapperString, imageString) => {
		const imageElement = translation.get(imageString)!;
		const wrapperElement = temporaryElementMap.get(wrapperString)!;
		const currentRoot = root.get(imageElement)!;
		const animation = animations.get(wrapperElement)!;

		animation.onfinish = () => {
			//this needs to happen after the mainElement was swapped out again
			queueMicrotask(() => wrapperElement.remove());
		};

		onStart.push(() => {
			wrapperElement.appendChild(imageElement);
			currentRoot.appendChild(wrapperElement);
		});
	});
};

const setPlaceholderCallbacks = (
	resultTransferable: ResultTransferable,
	result: Result,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { placeholders, totalRuntime } = resultTransferable;
	const { animations, onStart } = result;
	const { translation } = state;

	placeholders.forEach((placeHolderString, imageString) => {
		const imageElement = translation.get(imageString)!;
		const placeholderElement = temporaryElementMap.get(placeHolderString)!;
		const animation = new Animation(new KeyframeEffect(placeholderElement, null, totalRuntime));
		const nextSibling = imageElement.nextElementSibling;
		const parent = imageElement.parentElement!;

		animation.onfinish = () => {
			try {
				parent.replaceChild(imageElement, placeholderElement);
			} catch (error) {
				placeholderElement.remove();
			}
		};
		animations.set(placeholderElement, animation);
		onStart.push(() => {
			nextSibling
				? parent.insertBefore(placeholderElement, nextSibling)
				: parent.appendChild(placeholderElement);
		});
	});
};

const createAnimations = (
	resultTransferable: ResultTransferable,
	result: Result,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { keyframes, totalRuntime } = resultTransferable;
	const { animations } = result;
	const { translation } = state;

	keyframes.forEach((elementKeyframes, key) => {
		const domElement = translation.get(key) || temporaryElementMap.get(key)!;
		animations.set(
			domElement,
			new Animation(
				new KeyframeEffect(domElement, fillImplicitKeyframes(elementKeyframes), totalRuntime)
			)
		);
	});
};

const setDefaultCallbacks = (
	resultTransferable: ResultTransferable,
	result: Result,
	state: MainState
) => {
	const { resultingStyle, overrides } = resultTransferable;
	const { animations, onStart } = result;
	const { translation } = state;

	animations.forEach((animation, domElement) => {
		const key = translation.get(domElement)!;

		const originalStyle = domElement.style.cssText;
		const elementStyle = resultingStyle.get(key);
		const overrideStyle = overrides.get(key);

		if (!elementStyle && !overrideStyle) {
			return;
		}

		onStart.push(() => applyCSSStyles(domElement, { ...elementStyle, ...overrideStyle }));

		animation.onfinish = () => {
			domElement.style.cssText = originalStyle;
			if (!elementStyle) {
				return;
			}
			applyCSSStyles(domElement, elementStyle);
		};
	});
};

export const createAnimationsFromKeyframes = (
	state: MainState,
	resultTransferable: ResultTransferable
): Result => {
	const result: Result = {
		animations: new Map<HTMLElement, Animation>(),
		onStart: [],
		timeKeeper: new Animation(new KeyframeEffect(null, null, resultTransferable.totalRuntime)),
	};

	const temporaryElementMap = getTemporaryElements(resultTransferable, state.translation);

	console.log(resultTransferable);

	createAnimations(resultTransferable, result, state, temporaryElementMap);
	setWrapperCallbacks(resultTransferable, result, state, temporaryElementMap);
	setPlaceholderCallbacks(resultTransferable, result, state, temporaryElementMap);
	setDefaultCallbacks(resultTransferable, result, state);

	return result;
};
