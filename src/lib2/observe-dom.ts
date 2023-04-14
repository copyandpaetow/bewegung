import {
	saveDefaultReadout,
	saveImageReadout,
	seperateElementReadouts,
} from "./read-element-styles";
import { MainState } from "./types";
import { isHTMLElement } from "./utils/predicates";

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

	if (parentUpdate.size > 0) {
		worker("updateState").reply("sendStateUpdate", parentUpdate);
	}

	return newDomElements;
};

export const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || isHTMLElement(node)) {
		return node as HTMLElement | null;
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

export const readdRemovedNodes = (entries: MutationRecord[]) => {
	const removedElements: HTMLElement[] = [];
	entries.forEach((entry) => {
		entry.removedNodes.forEach((element) => {
			entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
			if (isHTMLElement(element)) {
				removedElements.push(element as HTMLElement);
			}
		});
	});
	return removedElements;
};

const removeAddedNodes = (entries: MutationRecord[]) => {
	//@ts-expect-error
	entries.forEach((entry) => entry.addedNodes.forEach((node) => node?.remove()));
};

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

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

			const { textElements, defaultElements, imageElements } =
				seperateElementReadouts(elementTranslations);

			reply("sendDOMRects", {
				imageChanges: saveImageReadout(imageElements, offset),
				textChanges: saveDefaultReadout(textElements, offset),
				defaultChanges: saveDefaultReadout(defaultElements, offset),
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
	});
