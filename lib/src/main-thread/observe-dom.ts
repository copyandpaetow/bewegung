import { AtomicWorker, NormalizedOptions } from "../types";
import { Attributes } from "../utils/constants";
import { applyCSSStyles, nextRaf, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { recordElement } from "./label-elements";
import {
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
	element.dataset.bewegungsKey = `key-added-${(element as HTMLElement).tagName}-${index}`;
};

export const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || isHTMLElement(node)) {
		return node as HTMLElement | null;
	}
	//@ts-expect-error node has the nextElementSibling propertys
	return getNextElementSibling(node.nextElementSibling);
};

const unhideRemovedElements = () => {
	querySelectorAll(`[${Attributes.cssReset}]`).forEach((element) => {
		const reset = element.dataset.bewegungsReset ?? "";
		element.style.cssText = reset;
	});
};

//TODO: recheck this approach => why hide + remove instead of reading without these elements and adding them later?
export const readdRemovedNodesHidden = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	element.dataset.bewegungsCssReset = element.style.cssText;
	element.style.display = "none";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

export const observeDom = async (options: NormalizedOptions, worker: AtomicWorker) => {
	const { reply } = worker("domChanges");
	let index = -1;

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		iterateAddedElements(entries, addKeyToNewlyAddedElement);
		iterateRemovedElements(entries, readdRemovedNodesHidden);

		reply("sendDOMRepresentation", { key: options.key, dom: recordElement(options.root, index) });

		unhideRemovedElements();
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
