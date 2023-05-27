import { AtomicWorker, DomTree } from "../types";
import { Attributes } from "../utils/constants";
import { querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { readElementStyles } from "./read-element-styles";

const resetNodeStyle = (entries: MutationRecord[]) => {
	[...entries].reverse().forEach((entry) => {
		const element = entry.target as HTMLElement;
		const attributeName = entry.attributeName as string;
		const oldValue = entry.oldValue ?? "";
		element.dataset.bewegungsReset = "";

		if (!oldValue && attributeName !== "style") {
			element.removeAttribute(attributeName);
			return;
		}

		element.setAttribute(attributeName, oldValue);
	});
};

const addKeyToNewlyAddedElement = (element: HTMLElement, index: number) => {
	const key = `key-added-${(element as HTMLElement).tagName}-${index}`;
	element.dataset.bewegungsKey = key;

	querySelectorAll("*", element).forEach((child, innerIndex) => {
		child.dataset.bewegungsKey = `${key}-${innerIndex}`;
	});
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
	entries.forEach((entry) => {
		entry.removedNodes.forEach((element) => {
			entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
			if (isHTMLElement(element)) {
				(element as HTMLElement).dataset.bewegungsReset = "";
				(element as HTMLElement).dataset.bewegungsRemoveable = "";
			}
		});
	});
};

const removeAddedNodes = (entries: MutationRecord[]) => {
	//@ts-expect-error
	entries.forEach((entry) => entry.addedNodes.forEach((node) => node?.remove()));
};

export const addKeyToCustomElements = (entries: MutationRecord[]) => {
	entries
		.flatMap((entry) => [...entry.addedNodes])
		.filter(isHTMLElement)
		//@ts-expect-error
		.forEach(addKeyToNewlyAddedElement);
};

export const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

export const observeDom = (callbacks: Map<number, VoidFunction[]>, worker: AtomicWorker) =>
	new Promise<void>((resolve) => {
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
			const domTrees = new Map<string, DomTree>();

			addKeyToCustomElements(addEntries);

			querySelectorAll(`[${Attributes.rootEasing}]`).forEach((rootElement) => {
				const key = rootElement.dataset.bewegungsKey!;
				domTrees.set(key, readElementStyles(rootElement, null, offset));
			});

			reply("sendDOMRects", {
				domTrees,
				currentTime: Date.now(),
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
