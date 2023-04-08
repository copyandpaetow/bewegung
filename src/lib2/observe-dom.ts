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

const resetNodeStyle = (entries: MutationRecord[]) => {
	entries.forEach((entry) => {
		const element = entry.target as HTMLElement;
		const attributeName = entry.attributeName as string;
		const oldValue = entry.oldValue;

		if (!oldValue) {
			element.removeAttribute(attributeName);
			return;
		}

		element.setAttribute(attributeName, oldValue);
	});
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

export const registerElementAdditons = (entries: MutationRecord[], state: MainState) => {
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

export const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || node instanceof HTMLElement) {
		return node;
	}
	//@ts-expect-error node has the nextElementSibling property
	return getNextElementSibling(node.nextElementSibling);
};

const separateEntries = (entries: MutationRecord[]) => {
	const removeEntries: MutationRecord[] = [];
	const addEntries: MutationRecord[] = [];
	const attributeEntries: MutationRecord[] = [];
	const characterDataEntries: MutationRecord[] = [];

	entries.forEach((entry) => {
		if (entry.type === "attributes") {
			attributeEntries.push(entry);
			return;
		}

		if (entry.type === "characterData") {
			characterDataEntries.push(entry);
			return;
		}

		if (entry.addedNodes.length > 0) {
			addEntries.push(entry);
			return;
		}
		removeEntries.push(entry);
	});

	return {
		removeEntries,
		addEntries,
		attributeEntries,
		characterDataEntries,
	};
};

const readdRemovedNodes = (entries: MutationRecord[]) => {
	entries.forEach((entry) => {
		entry.removedNodes.forEach((element) => {
			const parentElement = entry.target;
			const nextSibiling = getNextElementSibling(entry.nextSibling);
			parentElement.insertBefore(element, nextSibiling);
		});
	});
};

const removeAddedNodes = (entries: MutationRecord[]) => {
	//@ts-expect-error
	entries.forEach((entry) => entry.addedNodes.forEach((node) => node?.remove()));
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
		const { addEntries, removeEntries, attributeEntries } = separateEntries(entries);

		registerElementAdditons(addEntries, state);

		if (offset === 1) {
			console.log(entries);
			worker("state").reply("sendState", {
				parents,
				easings,
				ratios,
				textElements,
			});
		}

		reply("sendDOMRects", {
			changes: saveElementDimensions(elementTranslations, offset),
			offset,
		});

		removeAddedNodes(addEntries);
		readdRemovedNodes(removeEntries);
		resetNodeStyle(attributeEntries);

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
