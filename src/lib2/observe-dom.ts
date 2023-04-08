import { addElementToStates } from "./animation";
import { defaultChangeProperties } from "./constants";
import { BidirectionalMap } from "./element-translations";
import { ElementReadouts, MainState, NormalizedOptions, ResultTransferable } from "./types";

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

const getElementStyles = (element: HTMLElement, offset: number) => {
	const { top, left, width, height } = element.getBoundingClientRect();
	const computedElementStyle = window.getComputedStyle(element);

	const relevantStyles: ElementReadouts = {
		currentTop: top,
		currentLeft: left,
		unsaveWidth: width,
		unsaveHeight: height,
		currentWidth: width,
		currentHeight: height,
		offset,
	};

	const computedStyles = Object.entries(defaultChangeProperties).reduce(
		(accumulator, [key, property]) => {
			accumulator[key] = computedElementStyle.getPropertyValue(property);
			return accumulator;
		},
		relevantStyles
	);

	return computedStyles;
};

const saveElementDimensions = (
	translations: BidirectionalMap<string, HTMLElement>,
	offset: number
) => {
	const currentChange = new Map<string, ElementReadouts>();

	translations.forEach((domElement, elementString) => {
		if (!domElement.isConnected) {
			return;
		}
		currentChange.set(elementString, getElementStyles(domElement, offset));
	});

	return currentChange;
};

const resetStyle = (entry: MutationRecord, state: MainState) => {
	const { elementTranslations, elementResets } = state;
	const target = entry.target as HTMLElement;
	const key = elementTranslations.get(target)!;
	const savedAttributes = elementResets.get(key)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

export const serializeElement = (element: HTMLElement, key: string) => {
	const elementKey = element.hasAttribute("data-bewegungskey")
		? `key-${element.getAttribute("data-bewegungskey")}`
		: key;

	return `${element.tagName}-${elementKey}`;
};

const isHTMLElement = (node: Node) => node instanceof HTMLElement;

const getOptionsViaRoot = (
	element: HTMLElement,
	options: Map<VoidFunction, NormalizedOptions>,
	translation: BidirectionalMap<string, HTMLElement>
) => {
	const relatedOptions = new Set<NormalizedOptions>();

	options.forEach((option) => {
		const rootElement = translation.get(option.root)!;
		if (!rootElement.contains(element)) {
			return;
		}
		relatedOptions.add(option);
	});
	return relatedOptions;
};

//? this relies on all callbacks creating a mutation-event=> mutation event indices would correlate to the callback order. Maybe this can be done safer
export const handleElementAdditons = (entries: MutationRecord[], state: MainState) => {
	const { elementTranslations, options } = state;

	return entries
		.flatMap((entry) => [...entry.addedNodes])
		.filter(isHTMLElement)
		.map((element, index) => {
			const domElement = element as HTMLElement;
			const relatedOptions = getOptionsViaRoot(domElement, options, elementTranslations);

			[domElement, ...domElement.querySelectorAll("*")]
				.reduce((accumulator, currentElement) => {
					const key = serializeElement(currentElement as HTMLElement, `key-${index}`);
					if (elementTranslations.delete(key)) {
						elementTranslations.set(key, currentElement as HTMLElement);
						return accumulator;
					}

					elementTranslations.set(key, currentElement as HTMLElement);
					accumulator.push(currentElement as HTMLElement);
					return accumulator;
				}, [] as HTMLElement[])
				.forEach((currentElement) => {
					addElementToStates(relatedOptions, currentElement, state);
				});
			return domElement;
		});
};

const resetElements = (entry: MutationRecord, state: MainState) => {
	const { parents, siblings, elementTranslations } = state;

	entry.removedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const key = elementTranslations.get(target)!;
		const parentElement = elementTranslations.get(parents.get(key)!)!;
		const nextSibiling = elementTranslations.get(siblings.get(key)!)!;

		parentElement.insertBefore(target, nextSibiling);
	});

	entry.addedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		target.remove();
	});
};

export const setObserver = (state: MainState) => {
	const { worker, callbacks, elementTranslations, parents, easings, ratios, textElements } = state;
	const { reply, cleanup } = worker("domChanges");
	const changes = callbacks.entries();
	const currentChange: {
		offset: number;
		callbacks: VoidFunction[];
	} = {
		offset: -1,
		callbacks: [],
	};

	const nextChange = () => {
		const { value, done } = changes.next();
		if (Boolean(done)) {
			return true;
		}

		const [currentOffset, currentCallbacks] = value;

		currentChange.offset = currentOffset;
		currentChange.callbacks = currentCallbacks;

		return false;
	};

	const callNextChange = (observer: MutationObserver) => {
		requestAnimationFrame(() => {
			const callbacks = currentChange.callbacks;

			if (callbacks.length === 0) {
				observerCallback([], observer);
				return;
			}

			callbacks.forEach((callback: VoidFunction) => {
				callback();
			});
		});
	};

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		const offset = currentChange.offset;

		handleElementAdditons(entries, state);

		if (offset === 1) {
			worker("state").reply("sendState", {
				parents,
				easings,
				ratios,
				textElements,
			});
		}

		//TODO: besides the target element, we could get the parent element, see if that changed in dimension
		// if yes, get the next parent, if no just get the siblings
		reply("sendDOMRects", {
			changes: saveElementDimensions(elementTranslations, offset),
			offset,
		});

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, state);
					break;

				case "childList":
					resetElements(entry, state);
					break;

				case "characterData":
					//TODO: how to handle this?
					break;

				default:
					break;
			}
		});

		if (Boolean(nextChange())) {
			cleanup();
			return;
		}
		observe(observer);
		callNextChange(observer);
	};

	const observer = new MutationObserver(observerCallback);

	observe(observer);
	nextChange();
	callNextChange(observer);

	return observer;
};
