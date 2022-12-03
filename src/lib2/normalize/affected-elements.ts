import { ElementEntry, State, WorkerMethods } from "../types";
import { uuid } from "../utils";

const DOM = {
	parent(element: HTMLElement): HTMLElement {
		return element.parentElement as HTMLElement;
	},
	siblings(element: HTMLElement): HTMLElement[] {
		return Array.from(DOM.parent(element).children) as HTMLElement[];
	},
	decendants(element: HTMLElement): HTMLElement[] {
		return (Array.from(element.querySelectorAll("*")) as HTMLElement[]).concat(element);
	},
	ancestors(
		element: HTMLElement,
		rootElement: HTMLElement,
		elementMap: HTMLElement[] = []
	): HTMLElement[] {
		if (rootElement === element) {
			return elementMap.concat(element);
		}
		return DOM.ancestors(DOM.parent(element), rootElement, elementMap.concat(element));
	},
};

export const findAffectedDOMElements = (
	element: HTMLElement,
	rootElement: HTMLElement
): HTMLElement[] => {
	//? maybe this could be done with ":has() as well if support gets better"
	//? should all decendants for all elements be really included? This has huge performance implications
	const relatives = new Set(
		DOM.ancestors(element, rootElement).flatMap(DOM.siblings).flatMap(DOM.decendants)
	);

	return [...relatives] as HTMLElement[];
};

const compareRootElements = (current: HTMLElement, previous: HTMLElement | undefined | null) => {
	if (!previous || current.contains(previous)) {
		return current;
	}
	if (previous.contains(current)) {
		return previous;
	}
	//here they are either siblings or the same element
	return current;
};

export const getRootElement = (selectors: string[]): HTMLElement => {
	let root: HTMLElement | undefined;

	selectors.forEach((selector) => {
		const rootElement = document.querySelector(selector) as HTMLElement | null;

		if (!rootElement) {
			throw new Error("no root element with that selector");
		}

		root = compareRootElements(rootElement, root);
	});
	return root as HTMLElement;
};

const isTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (childNodes.length === 0) {
		return false;
	}

	return childNodes.every((node) => Boolean(node.textContent?.trim())) ? "text" : false;
};
const isImage = (mainElement: HTMLElement) => (mainElement.tagName === "IMG" ? "image" : false);

export const getAffectedElements = (state: State) => {
	const { elementLookup, mainElements, options } = state;
	const chunkLookup = new Map<HTMLElement, Set<string>>();
	const stringifiedElementLookup = new Map<string, ElementEntry>();

	mainElements.forEach((mainElementStrings, chunkID) => {
		mainElementStrings.forEach((mainElementString) => {
			const domElement = elementLookup.get(mainElementString)!;
			const rootSelector = options.get(chunkID)!.rootSelector!;
			const rootElement = document.querySelector(rootSelector) as HTMLElement;

			chunkLookup.set(domElement, (chunkLookup.get(domElement) ?? new Set()).add(chunkID));

			findAffectedDOMElements(domElement, rootElement).forEach((secondaryElement, index, array) => {
				chunkLookup.set(
					secondaryElement,
					(chunkLookup.get(secondaryElement) ?? new Set()).add(chunkID)
				);
				if (elementLookup.has(secondaryElement)) {
					return;
				}
				elementLookup.set(uuid("secondary"), secondaryElement);
			});
		});
	});

	chunkLookup.forEach((relevantChunkIDs, element) => {
		const id = elementLookup.get(element)!;
		const parentID = elementLookup.get(element.parentElement!) ?? id;
		const elementType = isImage(element) || isTextNode(element) || "default";

		const rootElement = getRootElement(
			Array.from(relevantChunkIDs, (chunkID) => options.get(chunkID)!.rootSelector!)
		);
		const rootID = elementLookup.get(rootElement)!;

		stringifiedElementLookup.set(id, {
			root: rootID,
			parent: parentID,
			type: elementType,
			chunks: [...relevantChunkIDs],
		});
	});

	return stringifiedElementLookup;
};
