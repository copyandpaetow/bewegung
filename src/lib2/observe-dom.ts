import { defaultChangeProperties } from "./constants";
import { createAnimations } from "./create-animations";
import { BidirectionalMap } from "./element-translations";
import {
	AnimationState,
	ElementReadouts,
	InternalProps,
	MainState,
	NormalizedOptions,
	NormalizedProps,
} from "./types";

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
	//@ts-expect-error
	const ratio = (element?.naturalWidth ?? 1) / (element?.naturalHeight ?? -1);

	const relevantStyles: ElementReadouts = {
		currentTop: top,
		currentLeft: left,
		unsaveWidth: width,
		unsaveHeight: height,
		currentWidth: width,
		currentHeight: height,
		offset,
		ratio,
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
	entries.reverse().forEach((entry) => {
		const element = entry.target as HTMLElement;
		const attributeName = entry.attributeName as string;
		const oldValue = entry.oldValue ?? "";

		if (!oldValue && attributeName !== "style") {
			element.removeAttribute(attributeName);
			return;
		}

		element.setAttribute(attributeName, oldValue);
	});
};

export const serializeElement = (element: HTMLElement, key: number) => {
	const elementKey = element.getAttribute("data-bewegungskey") ?? key;

	return `${element.tagName}-key-${elementKey}`;
};

const isHTMLElement = (node: Node) => node instanceof HTMLElement;

export const registerElementAdditons = (entries: MutationRecord[], state: MainState) => {
	const { elementTranslations, parents, worker } = state;
	const parentUpdate = new Map<string, string>();

	const newDomElements = entries
		.flatMap((entry) => [...entry.addedNodes])
		.filter(isHTMLElement)
		.map((element, index) => {
			const domElement = element as HTMLElement;

			[domElement, ...domElement.querySelectorAll("*")]
				.reduce((accumulator, currentElement) => {
					const key = serializeElement(currentElement as HTMLElement, index);
					if (elementTranslations.delete(key)) {
						elementTranslations.set(key, currentElement as HTMLElement);
						return accumulator;
					}

					elementTranslations.set(key, currentElement as HTMLElement);
					accumulator.push(currentElement as HTMLElement);
					return accumulator;
				}, [] as HTMLElement[])
				.forEach((currentElement) => {
					const key = elementTranslations.get(currentElement)!;
					const parentKey = elementTranslations.get(currentElement.parentElement!)!;

					parentUpdate.set(key, parentKey);
					parents.set(key, parentKey);
				});
			return domElement;
		});

	worker("updateState").reply("sendStateUpdate", parentUpdate);

	return newDomElements;
};

export const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || node instanceof HTMLElement) {
		return node;
	}
	//@ts-expect-error node has the nextElementSibling property
	return getNextElementSibling(node.nextElementSibling);
};

export const separateEntries = (entries: MutationRecord[]) => {
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

export const observeDom = (state: MainState) =>
	new Promise<void>((resolve) => {
		const { worker, callbacks, elementTranslations } = state;
		const { reply, cleanup } = worker("domChanges");
		const changes = callbacks.entries();
		let offset = -1;
		let change: VoidFunction[] = [];

		const callNextChange = (observer: MutationObserver) => {
			const { value, done } = changes.next();
			if (Boolean(done)) {
				observer.disconnect();
				cleanup();
				resolve();
				return;
			}

			offset = value[0];
			change = value[1];

			requestAnimationFrame(() => {
				if (change.length === 0) {
					observerCallback([], observer);
					return;
				}

				observe(observer);
				change.forEach((callback: VoidFunction) => {
					callback();
				});
			});
		};

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			const { addEntries, removeEntries, attributeEntries } = separateEntries(entries);

			registerElementAdditons(addEntries, state);

			reply("sendDOMRects", {
				changes: saveElementDimensions(elementTranslations, offset),
				offset,
			});

			removeAddedNodes(addEntries);
			readdRemovedNodes(removeEntries);
			resetNodeStyle(attributeEntries);

			callNextChange(observer);
		};

		const observer = new MutationObserver(observerCallback);

		observe(observer);
		callNextChange(observer);

		return observer;
	});

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

export const createAnimationState = async (
	state: MainState,
	totalRuntime: number
): Promise<AnimationState> => {
	const { callbacks, elementTranslations, worker } = state;
	await observeDom(state);
	const animationState = {
		onStart: [],
		resultingChanges: callbacks.get(1)!,
		animations: new Map(),
		elementResets: new Map<string, Map<string, string>>(),
	};

	requestAnimationFrame(() => {
		elementTranslations.forEach((domElement, key) => {
			animationState.elementResets.set(key, saveOriginalStyle(domElement));
		});
	});

	const { onError, onMessage, cleanup } = worker("results");
	await onMessage(async (ResultTransferable) => {
		cleanup();
		await createAnimations(ResultTransferable, animationState, state, totalRuntime);
	});
	onError(() => {
		cleanup();
		throw new Error("something went wrong calculating the animation keyframes");
	});

	return animationState;
};
