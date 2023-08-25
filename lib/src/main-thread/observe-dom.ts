import { AtomicWorker, DomLabel, NormalizedOptions } from "../types";
import { applyCSSStyles, nextRaf, querySelectorAll } from "../utils/helper";
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
	//@ts-expect-error node has the nextElementSibling propertys
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

export const readdRemovedNodesHidden = (entries: MutationRecord[]) => {
	const unhide = new Map<HTMLElement, string>();

	entries.forEach((entry) => {
		entry.removedNodes.forEach((element) => {
			if (!isHTMLElement(element)) {
				return;
			}
			const htmlElement = element as HTMLElement;
			htmlElement.dataset.bewegungsReset = "";
			htmlElement.dataset.bewegungsRemovable = "";

			unhide.set(htmlElement, htmlElement.style.cssText);
			htmlElement.style.display = "none";

			entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
		});
	});

	/*
		 we want to readd the element hidden, so the tree still knows about it
		 we could also shortly add a shallow clone if this is too much browser work
		*/

	return () => {
		unhide.forEach((cssText, element) => {
			element.style.cssText = cssText;
		});
	};
};

const removeAddedNodes = (entries: MutationRecord[]) => {
	entries.forEach((entry) =>
		entry.addedNodes.forEach((node) => {
			//@ts-expect-error
			node?.remove();
		})
	);
};

const getDomLabels = (element: HTMLElement) => {
	const childrenLabel: DomLabel = [];
	const children = element.children;

	for (let index = 0; index < children.length; index++) {
		childrenLabel.push(getDomLabels(children.item(index) as HTMLElement));
	}

	return [element.dataset.bewegungsKey!, childrenLabel];
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

export const observeDom = async (props: NormalizedOptions, worker: AtomicWorker) => {
	const { reply } = worker("domChanges");
	let index = -1;

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();

		const { addEntries, removeEntries, attributeEntries } = separateEntries(entries);
		addKeyToCustomElements(addEntries);
		const unhideRemovedElements = readdRemovedNodesHidden(removeEntries);
		const domRepresentation = recordElement(props.root, index);

		reply("sendDOMRepresentation", domRepresentation);

		unhideRemovedElements();
		removeAddedNodes(addEntries);
		resetNodeStyle(attributeEntries);
	};

	const withRootGuards = () => {
		applyCSSStyles(props.root, { contain: "layout", overflow: "hidden" });
		props.from();
	};

	const observer = new MutationObserver(observerCallback);
	for await (const domChangeFn of [withRootGuards, props.to]) {
		await nextRaf();
		index += 1;
		observe(observer);
		domChangeFn();
	}
};
