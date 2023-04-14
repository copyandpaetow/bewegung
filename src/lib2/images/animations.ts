import { ImageResult, ImageTransferable, MainState } from "../types";
import {
	BEWEGUNG_DATA_ATTRIBUTE,
	BEWEGUNG_PLACEHOLDER,
	BEWEGUNG_WRAPPER,
	emptyImageSrc,
} from "../utils/constants";
import { BidirectionalMap } from "../utils/element-translations";
import { applyCSSStyles, emptyStyleReset } from "../utils/helper";

export const setImageAttributes = (element: HTMLImageElement, relatedElement: HTMLElement) => {
	relatedElement.getAttributeNames().forEach((attribute) => {
		element.setAttribute(attribute, relatedElement.getAttribute(attribute)!);
	});
	element.src = emptyImageSrc;
	element.setAttribute(BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_PLACEHOLDER);
};

const getTemporaryElements = (
	imageTransferable: ImageTransferable,
	translation: BidirectionalMap<string, HTMLElement>
) => {
	const { placeholders, wrappers, overrides } = imageTransferable;
	const temporaryElementMap = new Map<string, HTMLElement>();

	placeholders.forEach((elementID, placeholderID) => {
		const relatedElement = translation.get(elementID)!;
		const placeholderElement = document.createElement("img");
		const elementStyle = overrides.get(placeholderID)!;

		applyCSSStyles(placeholderElement, elementStyle);
		setImageAttributes(placeholderElement, relatedElement);
		temporaryElementMap.set(placeholderID, placeholderElement);
		overrides.delete(placeholderID);
	});

	wrappers.forEach((_, wrapperID) => {
		const wrapperElement = document.createElement("div");
		const elementStyle = overrides.get(wrapperID)!;

		applyCSSStyles(wrapperElement, elementStyle);

		wrapperElement.setAttribute(BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_WRAPPER);
		temporaryElementMap.set(wrapperID, wrapperElement);
		overrides.delete(wrapperID);
	});

	return temporaryElementMap;
};

const createAnimationsFromKeyframes = (
	keyframes: Map<string, Keyframe[]>,
	temporaryElementMap: Map<string, HTMLElement>,
	state: MainState
) => {
	const { elementTranslations, totalRuntime } = state;

	const animations = new Map<string, Animation>();

	keyframes.forEach((elementIDframes, key) => {
		const domElement = elementTranslations.get(key) || temporaryElementMap.get(key)!;
		const animation = new Animation(new KeyframeEffect(domElement, elementIDframes, totalRuntime));

		animations.set(key, animation);
	});

	return animations;
};

const setImageCallbacks = (
	animations: Map<string, Animation>,
	imageTransferable: ImageTransferable,
	temporaryElementMap: Map<string, HTMLElement>,
	elementTranslations: BidirectionalMap<string, HTMLElement>
) => {
	const { overrides, wrappers, placeholders } = imageTransferable;
	const onStart: VoidFunction[] = [];
	animations.forEach((animation, key) => {
		const overrideStyle = overrides.get(key);
		const domElement = elementTranslations.get(key) ?? temporaryElementMap.get(key)!;

		if (overrideStyle) {
			onStart.push(() => applyCSSStyles(domElement, overrideStyle));
			const reset = emptyStyleReset(overrideStyle);
			animation.onfinish = () => applyCSSStyles(domElement, reset);
		}

		if (wrappers.has(key)) {
			const imageKey = wrappers.get(key) ?? placeholders.get(key)!;
			const imageElement = elementTranslations.get(imageKey)!;
			const parent = imageElement.parentElement!;

			animation.onfinish = () => {
				//this needs to happen after the mainElement was swapped out again
				queueMicrotask(() => domElement.remove());
			};
			onStart.push(() => {
				parent.appendChild(domElement).appendChild(imageElement);
			});
		}

		if (placeholders.has(key)) {
			const imageKey = wrappers.get(key) ?? placeholders.get(key)!;
			const imageElement = elementTranslations.get(imageKey)!;
			const parent = imageElement.parentElement!;

			animation.onfinish = () => {
				try {
					parent.replaceChild(imageElement, domElement);
				} catch (error) {
					domElement.remove();
				}
			};
			onStart.push(() => {
				imageElement.nextElementSibling
					? parent.insertBefore(domElement, imageElement.nextElementSibling)
					: parent.appendChild(domElement);
			});
		}
	});
	return onStart;
};

export const createImageAnimations = (
	imageTransferable: ImageTransferable,
	state: MainState
): ImageResult => {
	console.log(imageTransferable);
	const { keyframes, wrappers, overrides, placeholders, partialElements } = imageTransferable;
	const { elementTranslations } = state;

	const temporaryElementMap = getTemporaryElements(imageTransferable, elementTranslations);

	const animations = createAnimationsFromKeyframes(keyframes, temporaryElementMap, state);
	const onStart = setImageCallbacks(
		animations,
		imageTransferable,
		temporaryElementMap,
		elementTranslations
	);

	return { overrides, partialElements, animations, onStart, wrappers, placeholders };
};
