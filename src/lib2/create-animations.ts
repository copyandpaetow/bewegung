import {
	BEWEGUNG_DATA_ATTRIBUTE,
	BEWEGUNG_PLACEHOLDER,
	BEWEGUNG_WRAPPER,
	emptyImageSrc,
} from "./constants";
import { BidirectionalMap } from "./element-translations";
import { MainState, ResultTransferable } from "./types";

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
	resultTransferable: ResultTransferable,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { keyframes } = resultTransferable;
	const { animations, elementTranslations, totalRuntime } = state;

	keyframes.forEach((elementIDframes, key) => {
		const domElement = elementTranslations.get(key) || temporaryElementMap.get(key)!;
		const animation = new Animation(new KeyframeEffect(domElement, elementIDframes, totalRuntime));

		animations.set(key, animation);
	});
};

const setWrapperCallbacks = (
	resultTransferable: ResultTransferable,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { wrappers } = resultTransferable;
	const { animations, onStart, elementTranslations } = state;

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
	resultTransferable: ResultTransferable,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { placeholders } = resultTransferable;
	const { animations, onStart, elementTranslations, totalRuntime } = state;

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

const setDefaultCallbacks = (resultTransferable: ResultTransferable, state: MainState) => {
	const { overrides, overrideResets, elementsToBeRemoved } = resultTransferable;
	const { animations, onStart, elementTranslations } = state;

	animations.forEach((animation, key) => {
		const domElement = elementTranslations.get(key)!;

		const overrideResetStyle = overrideResets.get(key);
		const overrideStyle = overrides.get(key);
		const shouldElementBeRemoved = elementsToBeRemoved.has(key);

		if (overrideStyle) {
			console.log(key, overrideStyle);
			onStart.push(() => applyCSSStyles(domElement, overrideStyle));
		}

		if (overrideResetStyle || shouldElementBeRemoved) {
			animation.onfinish = () => {
				overrideResetStyle && applyCSSStyles(domElement, overrideResetStyle);
				shouldElementBeRemoved && domElement.remove();
			};
		}
	});
};

export const setOnPlayObserver = (
	resultTransferable: ResultTransferable,
	state: MainState,
	temporaryElementMap: Map<string, HTMLElement>
) => {
	const { elementTranslations, siblings, parents } = state;
	const { elementsToBeRemoved, wrappers } = resultTransferable;
	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();

		entries.forEach((entry, index) => {
			entry.addedNodes.forEach((target) => {
				if (!(target instanceof HTMLElement)) {
					return;
				}
				[target, ...target.querySelectorAll("*")].forEach((element, elementCount) => {
					const key = `${index}-${element.tagName}-${elementCount}`;
					if (elementTranslations.has(key)) {
						elementTranslations.updateValue(key, element as HTMLElement);
					}
				});
			});
		});

		entries
			.flatMap((entry) => [...entry.removedNodes])
			.forEach((target) => {
				if (!(target instanceof HTMLElement)) {
					return;
				}
				const key = elementTranslations.get(target)!;
				console.log({ key });
				if (!elementsToBeRemoved.has(key)) {
					return;
				}
				if (wrappers.has(key)) {
					const wrapperElement = temporaryElementMap.get(wrappers.get(key)!)!;
					wrapperElement.insertBefore(target, null);
					return;
				}

				const parentElement = elementTranslations.get(parents.get(key)!)!;
				const nextSibiling = elementTranslations.get(siblings.get(key)!)!;

				parentElement.insertBefore(target, nextSibiling);
			});
	};

	new MutationObserver(observerCallback).observe(document.body, { childList: true, subtree: true });
};

export const createAnimations = (resultTransferable: ResultTransferable, state: MainState) => {
	console.log(resultTransferable);

	const temporaryElementMap = getTemporaryElements(resultTransferable, state.elementTranslations);

	createAnimationsFromKeyframes(resultTransferable, state, temporaryElementMap);
	setWrapperCallbacks(resultTransferable, state, temporaryElementMap);
	setPlaceholderCallbacks(resultTransferable, state, temporaryElementMap);
	setDefaultCallbacks(resultTransferable, state);

	setOnPlayObserver(resultTransferable, state, temporaryElementMap);
};
