import { BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_WRAPPER } from "../shared/constants";
import { BidirectionalMap } from "../shared/element-translations";
import { AtomicWorker, MainState, Result, ResultTransferable } from "../types";
import { applyCSSStyles } from "./apply-styles";
import { setImageAttributes } from "./css-resets";

const getTemporaryElements = (
	resultTransferable: ResultTransferable,
	translation: BidirectionalMap<string, HTMLElement>
) => {
	const { placeholders, wrappers, resultingStyle } = resultTransferable;
	const temporaryElementMap = new Map<string, HTMLElement>();

	placeholders.forEach((placeholderID, elementID) => {
		const relatedElement = translation.get(elementID)!;
		const placeholderElement = document.createElement("img");
		const elementStyle = resultingStyle.get(placeholderID)!;

		applyCSSStyles(elementStyle, placeholderElement);
		setImageAttributes(placeholderElement, relatedElement);
		temporaryElementMap.set(placeholderID, placeholderElement);
		resultingStyle.delete(placeholderID);
	});

	wrappers.forEach((wrapperID) => {
		const wrapperElement = document.createElement("div");
		const elementStyle = resultingStyle.get(wrapperID)!;

		applyCSSStyles(elementStyle, wrapperElement);

		wrapperElement.setAttribute(BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_WRAPPER);
		temporaryElementMap.set(wrapperID, wrapperElement);
		resultingStyle.delete(wrapperID);
	});

	return temporaryElementMap;
};

const setWrapperCallbacks = (
	resultTransferable: ResultTransferable,
	result: Result,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { wrappers } = resultTransferable;
	const { animations, onStart, translation } = result;

	wrappers.forEach((wrapperID, imageID) => {
		const imageElement = translation.get(imageID)!;
		const wrapperElement = temporaryElementMap.get(wrapperID)!;
		const parent = imageElement.parentElement!;
		const animation = animations.get(wrapperElement)!;

		animation.onfinish = () => {
			//this needs to happen after the mainElement was swapped out again
			queueMicrotask(() => wrapperElement.remove());
		};

		onStart.push(() => {
			parent.appendChild(wrapperElement).appendChild(imageElement);
		});
	});
};

const setPlaceholderCallbacks = (
	resultTransferable: ResultTransferable,
	result: Result,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { placeholders, totalRuntime } = resultTransferable;
	const { animations, onStart, translation } = result;

	placeholders.forEach((placeHolderID, imageID) => {
		const imageElement = translation.get(imageID)!;
		const placeholderElement = temporaryElementMap.get(placeHolderID)!;
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
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { keyframes, totalRuntime } = resultTransferable;
	const { animations, translation } = result;

	keyframes.forEach((elementIDframes, key) => {
		const domElement = translation.get(key) || temporaryElementMap.get(key)!;
		animations.set(
			domElement,
			new Animation(new KeyframeEffect(domElement, elementIDframes, totalRuntime))
		);
	});
};

const setDefaultCallbacks = (resultTransferable: ResultTransferable, result: Result) => {
	const { resultingStyle, overrides } = resultTransferable;
	const { animations, onStart, translation } = result;

	animations.forEach((animation, domElement) => {
		const key = translation.get(domElement)!;

		const originalStyle = domElement.style.cssText;
		const elementStyle = resultingStyle.get(key);
		const overrideStyle = overrides.get(key);

		if (!elementStyle && !overrideStyle) {
			return;
		}

		onStart.push(() => applyCSSStyles({ ...elementStyle, ...overrideStyle }, domElement));

		animation.onfinish = () => {
			domElement.style.cssText = originalStyle;
			if (!elementStyle) {
				return;
			}
			applyCSSStyles(elementStyle, domElement);
		};
	});
};

export const createAnimationsFromKeyframes = (
	resultTransferable: ResultTransferable,
	state: MainState
): Result => {
	const result: Result = {
		animations: new Map<HTMLElement, Animation>(),
		onStart: [],
		timeKeeper: new Animation(new KeyframeEffect(null, null, resultTransferable.totalRuntime)),
		totalRuntime: resultTransferable.totalRuntime,
		...state,
	};

	const temporaryElementMap = getTemporaryElements(resultTransferable, state.translation);

	createAnimations(resultTransferable, result, temporaryElementMap);
	setWrapperCallbacks(resultTransferable, result, temporaryElementMap);
	setPlaceholderCallbacks(resultTransferable, result, temporaryElementMap);
	setDefaultCallbacks(resultTransferable, result);

	return result;
};

export const getResults = async (useWorker: AtomicWorker, state: MainState) => {
	const { onMessage, cleanup } = useWorker("receiveConstructedKeyframes");

	const resultPromise = (await onMessage((resultTransferable) =>
		createAnimationsFromKeyframes(resultTransferable, state)
	)) as Promise<Result>;
	cleanup();
	return resultPromise;
};
