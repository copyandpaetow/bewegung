import { NormalizedOptions, Messenger } from "../types";
import { applyCSSStyles, nextRaf, querySelectorAll } from "../utils/helper";
import { recordElement } from "./elements";
import {
	isHTMLElement,
	iterateAddedElements,
	iterateAttributesReversed,
	iterateRemovedElements,
	observe,
} from "./observer-helper";

const resetNodeStyle = (entry: MutationRecord): void => {
	const element = entry.target as HTMLElement;
	const attributeName = entry.attributeName as string;
	const oldValue = entry.oldValue ?? "";
	element.dataset.bewegungsReset = "";

	if (!oldValue && attributeName !== "style") {
		element.removeAttribute(attributeName);
		return;
	}

	element.setAttribute(attributeName, oldValue);
};

export const addKeyToNewlyAddedElement = (element: HTMLElement, index: number) => {
	element.dataset.bewegungsKey = `_added-${(element as HTMLElement).tagName}-${index}`;

	querySelectorAll("*", element).forEach((child, nestedIndex) => {
		child.dataset.bewegungsKey = `_added-${
			(element as HTMLElement).tagName
		}-${index}-${nestedIndex}`;
	});
};

const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || isHTMLElement(node)) {
		return node as HTMLElement | null;
	}
	//@ts-expect-error node has the nextElementSibling propertys
	return getNextElementSibling(node.nextElementSibling);
};

export const readdRemovedNodes = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

export const observeDom = async (options: NormalizedOptions, worker: Messenger) => {
	let index = -1;

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		iterateAddedElements(entries, addKeyToNewlyAddedElement);

		worker.send("domChanges", [options.key, recordElement(options.root, index)]);

		iterateRemovedElements(entries, readdRemovedNodes);
		iterateAddedElements(entries, (element) => element.remove());
		iterateAttributesReversed(entries, resetNodeStyle);
	};

	const observer = new MutationObserver(observerCallback);
	for await (const domChangeFn of [options.from, options.to]) {
		await nextRaf();
		index += 1;

		if (!domChangeFn) {
			observerCallback([], observer);
			continue;
		}

		observe(observer);
		applyCSSStyles(options.root, { contain: "layout inline-size" });
		domChangeFn();
	}
};
