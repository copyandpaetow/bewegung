import { AtomicWorker, NormalizedOptions } from "../types";
import { Attributes } from "../utils/constants";
import { querySelectorAll, nextRaf, applyCSSStyles } from "../utils/helper";
import {
	iterateAddedElements,
	iterateAttributesReversed,
	iterateRemovedElements,
	observe,
} from "./observer-helper";
import { isHTMLElement } from "../utils/predicates";
import { recordElement } from "./label-elements";

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

export const readdRemovedNodesHidden = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	element.dataset.bewegungsCssReset = element.style.cssText;
	element.style.display = "none";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

export const observeDom = async (props: NormalizedOptions, worker: AtomicWorker) => {
	const { reply } = worker("domChanges");
	let index = -1;

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();

		iterateAddedElements(entries, addKeyToNewlyAddedElement);
		iterateRemovedElements(entries, readdRemovedNodesHidden);

		reply("sendDOMRepresentation", recordElement(props.root, index));

		unhideRemovedElements();
		iterateAddedElements(entries, (element) => element.remove());
		iterateAttributesReversed(entries, resetNodeStyle);
	};

	const observer = new MutationObserver(observerCallback);
	for await (const domChangeFn of [props.from, props.to]) {
		await nextRaf();
		index += 1;

		if (!domChangeFn) {
			observerCallback([], observer);
			continue;
		}

		observe(observer);
		applyCSSStyles(props.root, { contain: "layout", overflow: "hidden" });
		domChangeFn();
	}
};
