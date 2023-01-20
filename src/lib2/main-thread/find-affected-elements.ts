import { getOrAddKeyFromLookup } from "../shared/element-translations";
import { EntryType, MainState } from "../types";
import { getRatio } from "./read-dom-properties";

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
		return DOM.ancestors(DOM.parent(element), rootElement, elementMap);
	},
};

export const findAffectedDOMElements = (
	element: HTMLElement,
	rootElement: HTMLElement
): HTMLElement[] => {
	//? maybe this could be done with ":has() as well if support gets better"
	//? should all decendants for all elements be really included? This has huge performance implications

	const relatives = new Set(
		DOM.ancestors(element, rootElement).concat(DOM.siblings(element)).flatMap(DOM.decendants)
	);

	return Array.from(relatives) as HTMLElement[];
};

export const compareRootElements = (
	current: HTMLElement,
	previous: HTMLElement | undefined | null
) => {
	if (!previous || current === previous || current.contains(previous)) {
		return current;
	}
	if (previous.contains(current)) {
		return previous;
	}
	//here they are either siblings or the same element
	return current;
};

const getRootElement = (entries: HTMLElement[]): HTMLElement => {
	let root: HTMLElement | undefined;

	entries.forEach((rootElement: HTMLElement) => {
		root = compareRootElements(rootElement, root);
	});

	return root as HTMLElement;
};

const isTextNode = (element: HTMLElement) => {
	if (!element.hasChildNodes()) {
		return false;
	}

	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()))
		? "text"
		: false;
};
const isImage = (mainElement: HTMLElement) => (mainElement.tagName === "IMG" ? "image" : false);

export const getGeneralTransferObject = (state: MainState) => {
	const { translation, root, resets } = state;

	const affectedElementsMap = new Map<string, Set<string>>();
	const elementConnections = new Map<string, HTMLElement[]>();

	const mainElements = new Set(resets.keys());

	mainElements.forEach((domElement) => {
		const elementString = translation.get(domElement)!;
		const rootElement = root.get(domElement)!;

		elementConnections.set(elementString, findAffectedDOMElements(domElement, rootElement));
	});

	elementConnections.forEach((secondaryDomElements, mainElementString) => {
		secondaryDomElements.forEach((secondaryDomElement) => {
			const secondaryElementString = getOrAddKeyFromLookup(secondaryDomElement, translation);

			affectedElementsMap.set(
				secondaryElementString,
				(affectedElementsMap.get(secondaryElementString) ?? new Set<string>()).add(
					mainElementString
				)
			);
		});
	});

	const rootString = new Map<string, string>();
	const parent = new Map<string, string>();
	const affectedBy = new Map<string, string[]>();
	const ratio = new Map<string, number>();
	const type = new Map<string, EntryType>();

	translation.forEach((domElement, elementString) => {
		const elementType = isImage(domElement) || isTextNode(domElement) || "";
		const affectedByMainElements = affectedElementsMap.get(elementString)!;

		const rootElement = getRootElement(
			Array.from(
				affectedByMainElements,
				(mainElementString: string) => root.get(translation.get(mainElementString)!)!
			)
		);
		root.set(domElement, rootElement);

		rootString.set(elementString, translation.get(rootElement)!);
		parent.set(elementString, translation.get(domElement.parentElement!)!);
		type.set(elementString, elementType);
		affectedBy.set(elementString, [...affectedByMainElements]);
		ratio.set(elementString, getRatio(domElement));
	});

	return {
		root: rootString,
		parent,
		type,
		affectedBy,
		ratio,
	};
};
