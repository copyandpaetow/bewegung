import { getRatio } from "../read/dom-properties";
import { ElementEntry, State, WorkerMethods } from "../types";
import { uuid } from "../utils";
import { getOrAddKeyFromLookup } from "./state";

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

export const getRootElement = (entries: string[] | HTMLElement[]): HTMLElement => {
	let root: HTMLElement | undefined;

	entries.forEach((selector: string | HTMLElement) => {
		const rootElement =
			typeof selector === "string"
				? (document.querySelector(selector) as HTMLElement | null)
				: selector;

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
	const { elementLookup, rootSelector, worker } = state;
	const stringifiedElementLookup = new Map<string, ElementEntry>();
	const getAffectedElementsMap = new Map<string, Set<string>>();
	const rootElements = new Map<string, HTMLElement>();

	const elementConnections = new Map<string, HTMLElement[]>();

	elementLookup.forEach((domElement, elementString) => {
		const rootElement = getRootElement(rootSelector.get(domElement)!);
		rootElements.set(elementString, rootElement);

		elementConnections.set(elementString, findAffectedDOMElements(domElement, rootElement));
	});

	elementConnections.forEach((secondaryDomElements, mainElementString) => {
		secondaryDomElements.forEach((secondaryDomElement) => {
			const secondaryElementString = getOrAddKeyFromLookup(secondaryDomElement, elementLookup);

			getAffectedElementsMap.set(
				secondaryElementString,
				(getAffectedElementsMap.get(secondaryElementString) ?? new Set<string>()).add(
					mainElementString
				)
			);
		});
	});

	elementLookup.forEach((domElement, elementString) => {
		const elementType = isImage(domElement) || isTextNode(domElement) || "default"; //TODO: this should also be an enum
		const affectedByMainElements = getAffectedElementsMap.get(elementString)!;

		const rootElement = getRootElement(
			Array.from(
				affectedByMainElements,
				(mainElementString: string) => rootElements.get(mainElementString)!
			)
		);

		stringifiedElementLookup.set(elementString, {
			self: elementString,
			root: elementLookup.get(rootElement)!,
			parent: elementLookup.get(
				domElement.tagName === "BODY" ? domElement : domElement.parentElement!
			)!,
			type: elementType,
			affectedBy: [...affectedByMainElements],
			ratio: getRatio(domElement),
		});
	});

	worker.sendQuery("sendElementLookup", stringifiedElementLookup);

	return stringifiedElementLookup;
};
