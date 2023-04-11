import {
	BEWEGUNG_DATA_ATTRIBUTE,
	BEWEGUNG_PLACEHOLDER,
	BEWEGUNG_WRAPPER,
	emptyImageSrc,
} from "./constants";
import { BidirectionalMap } from "./element-translations";
import { getNextElementSibling, registerElementAdditons, separateEntries } from "./observe-dom";
import { AnimationState, MainState, ResultState, ResultTransferable } from "./types";

/*

- create wrapper and placeholder elements
- create animations from keyframes
- create and add callbacks to these animations
- apply all callbacks with a MO to catch all removed or added elements
=> we can hide them on the fly
*/

/*
	how do we handle newly added elements? 
	- if we add them in the MO, how would we handle that
	- in a list of callbacks, they could be added multiple times
	- if we call all callbacks in the end, we would also re-add it

	we would need a way to turn an element into a constant, that will stay the same if an identical element is added
	=> maybe we could create an id from the function call id and a number? Given that the elements will always get created in the same order

*/

export const applyCSSStyles = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

export const setImageAttributes = (element: HTMLImageElement, relatedElement: HTMLElement) => {
	relatedElement.getAttributeNames().forEach((attribute) => {
		element.setAttribute(attribute, relatedElement.getAttribute(attribute)!);
	});
	element.src = emptyImageSrc;
	element.setAttribute(BEWEGUNG_DATA_ATTRIBUTE, BEWEGUNG_PLACEHOLDER);
};

const getTemporaryElements = (
	resultTransferable: ResultTransferable,
	translation: BidirectionalMap<string, HTMLElement>
) => {
	const { placeholders, wrappers, overrides } = resultTransferable;
	const temporaryElementMap = new Map<string, HTMLElement>();

	placeholders.forEach((placeholderID, elementID) => {
		const relatedElement = translation.get(elementID)!;
		const placeholderElement = document.createElement("img");
		const elementStyle = overrides.get(placeholderID)!;

		applyCSSStyles(placeholderElement, elementStyle);
		setImageAttributes(placeholderElement, relatedElement);
		temporaryElementMap.set(placeholderID, placeholderElement);
		overrides.delete(placeholderID);
	});

	wrappers.forEach((wrapperID) => {
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
	resultstate: ResultState,
	animationState: AnimationState,
	state: MainState
) => {
	const { keyframes, temporaryElementMap, totalRuntime } = resultstate;
	const { animations } = animationState;
	const { elementTranslations } = state;

	keyframes.forEach((elementIDframes, key) => {
		const domElement = elementTranslations.get(key) || temporaryElementMap.get(key)!;
		const animation = new Animation(new KeyframeEffect(domElement, elementIDframes, totalRuntime));

		animations.set(key, animation);
	});
};

const setWrapperCallbacks = (
	resultstate: ResultState,
	animationState: AnimationState,
	state: MainState
) => {
	const { wrappers, temporaryElementMap, onStart } = resultstate;
	const { animations } = animationState;
	const { elementTranslations } = state;

	wrappers.forEach((wrapperID, imageID) => {
		const imageElement = elementTranslations.get(imageID)!;
		const wrapperElement = temporaryElementMap.get(wrapperID)!;
		const parent = imageElement.parentElement!;
		const animation = animations.get(wrapperID)!;

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
	resultstate: ResultState,
	animationState: AnimationState,
	state: MainState
) => {
	const { placeholders, temporaryElementMap, totalRuntime, onStart } = resultstate;
	const { animations } = animationState;
	const { elementTranslations } = state;

	placeholders.forEach((placeHolderID, imageID) => {
		const imageElement = elementTranslations.get(imageID)!;
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
		animations.set(placeHolderID, animation);
		onStart.push(() => {
			nextSibling
				? parent.insertBefore(placeholderElement, nextSibling)
				: parent.appendChild(placeholderElement);
		});
	});
};

const setDefaultCallbacks = (
	resultstate: ResultState,
	animationState: AnimationState,
	state: MainState
) => {
	const { overrideResets, overrides, elementsToBeRemoved, onStart } = resultstate;
	const { animations } = animationState;
	const { elementTranslations } = state;

	animations.forEach((animation, key) => {
		const domElement = elementTranslations.get(key)!;
		const overrideResetStyle = overrideResets.get(key);
		const overrideStyle = overrides.get(key);
		const shouldElementBeRemoved = elementsToBeRemoved.has(key);

		if (overrideStyle) {
			onStart.push(() => applyCSSStyles(domElement, overrideStyle));
		}

		if (overrideResetStyle || shouldElementBeRemoved) {
			animation.onfinish = () => {
				if (shouldElementBeRemoved) {
					domElement.remove();
					return;
				}
				overrideResetStyle && applyCSSStyles(domElement, overrideResetStyle);
			};
		}
	});
};

export const setOnPlayObserver = (
	resultstate: ResultState,
	animationState: AnimationState,
	state: MainState
) =>
	new Promise<void>((resolve) => {
		const {
			wrappers,
			overrideResets,
			overrides,
			elementsToBeRemoved,
			elementsToBeAdded,
			totalRuntime,
			temporaryElementMap,
			onStart,
			resultingChanges,
		} = resultstate;
		const { animations } = animationState;
		const { elementTranslations } = state;

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { addEntries, removeEntries } = separateEntries(entries);

			registerElementAdditons(addEntries, state).forEach((element) => {
				const key = elementTranslations.get(element)!;

				const keyframe = elementsToBeAdded.get(key)!;
				const override = overrides.get(key)!;
				const overrideReset = overrideResets.get(key)!;
				const animation = new Animation(new KeyframeEffect(element, keyframe, totalRuntime));

				applyCSSStyles(element, override);

				animation.onfinish = () => applyCSSStyles(element, overrideReset);

				animations.set(key, animation);
			});

			removeEntries.forEach((entry) => {
				entry.removedNodes.forEach((element) => {
					if (!(element instanceof HTMLElement)) {
						return;
					}
					const key = elementTranslations.get(element)!;
					const override = overrides.get(key)!;

					if (wrappers.has(key)) {
						const wrapperElement = temporaryElementMap.get(wrappers.get(key)!)!;
						wrapperElement.insertBefore(element, null);
						return;
					}

					const keyframe = elementsToBeRemoved.get(key)!;
					const animation = new Animation(new KeyframeEffect(element, keyframe, totalRuntime));
					applyCSSStyles(element, override);

					entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));

					animation.onfinish = () => element.remove();
					animations.set(key, animation);
				});
			});

			onStart.forEach((cb) => cb());
			resolve();
		};
		const observer = new MutationObserver(observerCallback);
		observer.observe(document.body, { childList: true, subtree: true, attributes: true });
		requestAnimationFrame(() => {
			resultingChanges.forEach((cb) => cb());
		});
	});

export const createAnimations = async (
	resultTransferable: ResultTransferable,
	animationState: AnimationState,
	state: MainState,
	totalRuntime: number
) => {
	const resultState = {
		...resultTransferable,
		temporaryElementMap: getTemporaryElements(resultTransferable, state.elementTranslations),
		totalRuntime,
		onStart: [],
		resultingChanges: state.callbacks.get(1)!,
	};

	createAnimationsFromKeyframes(resultState, animationState, state);
	setWrapperCallbacks(resultState, animationState, state);
	setPlaceholderCallbacks(resultState, animationState, state);
	setDefaultCallbacks(resultState, animationState, state);

	await setOnPlayObserver(resultState, animationState, state);
};
