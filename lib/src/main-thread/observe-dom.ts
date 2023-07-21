import { AtomicWorker, DomRepresentation, PropsWithRelativeTiming2 } from "../types";
import { execute, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { recordElement } from "./label-elements";

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
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

export const observeDom = (domUpdates: PropsWithRelativeTiming2[], worker: AtomicWorker) =>
	new Promise<void>((resolve) => {
		const { reply, cleanup } = worker("domChanges");
		let currentIndex = -1;
		let waitingForCallback = false;

		const callNextChange = (observer: MutationObserver) => {
			currentIndex += 1;

			if (domUpdates[currentIndex] === undefined) {
				observer.disconnect();
				cleanup();
				resolve();
				return;
			}

			requestAnimationFrame(() => {
				observe(observer);
				domUpdates[currentIndex].callback.forEach(execute);
				waitingForCallback = true;

				requestAnimationFrame(() => {
					if (waitingForCallback) {
						callNextChange(observer);
					}
				});
			});
		};

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();
			waitingForCallback = false;
			const { addEntries, removeEntries, attributeEntries } = separateEntries(entries);
			addKeyToCustomElements(addEntries);
			const domRepresentation: DomRepresentation[] = [];

			domRepresentation.push(
				recordElement(domUpdates[currentIndex].root, {
					easing: domUpdates[currentIndex].easing,
					offset: domUpdates[currentIndex].end,
				})
			);

			reply("sendDOMRepresentation", domRepresentation);

			removeAddedNodes(addEntries);
			readdRemovedNodes(removeEntries);
			resetNodeStyle(attributeEntries);

			callNextChange(observer);
		};

		callNextChange(new MutationObserver(observerCallback));
	});
