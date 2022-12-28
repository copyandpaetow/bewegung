import { Context, MainState } from "../types";
import { getOrAddKeyFromLookup } from "./element-translations";
import { getRatio } from "./read-dom-properties";
import { generalTransferObject } from "./state";

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

const getRootElement = (entries: string[] | HTMLElement[]): HTMLElement => {
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
	if (!element.hasChildNodes()) {
		return false;
	}

	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()))
		? "text"
		: false;
};
const isImage = (mainElement: HTMLElement) => (mainElement.tagName === "IMG" ? "image" : false);

export const setGeneralTransferObject = ({ state }: Context<MainState>) => {
	const getAffectedElementsMap = new Map<string, Set<string>>();
	const rootElements = new Map<string, HTMLElement>();
	const elementConnections = new Map<string, HTMLElement[]>();
	const newGeneralTransferObject = generalTransferObject();

	state.elementTranslation.forEach((domElement, elementString) => {
		const rootElement = getRootElement(state.rootSelector.get(domElement)!);
		rootElements.set(elementString, rootElement);

		elementConnections.set(elementString, findAffectedDOMElements(domElement, rootElement));
	});

	elementConnections.forEach((secondaryDomElements, mainElementString) => {
		secondaryDomElements.forEach((secondaryDomElement) => {
			const secondaryElementString = getOrAddKeyFromLookup(
				secondaryDomElement,
				state.elementTranslation
			);

			getAffectedElementsMap.set(
				secondaryElementString,
				(getAffectedElementsMap.get(secondaryElementString) ?? new Set<string>()).add(
					mainElementString
				)
			);
		});
	});

	state.elementTranslation.forEach((domElement, elementString) => {
		const elementType = isImage(domElement) || isTextNode(domElement) || "default";
		const affectedByMainElements = getAffectedElementsMap.get(elementString)!;

		const rootElement = getRootElement(
			Array.from(
				affectedByMainElements,
				(mainElementString: string) => rootElements.get(mainElementString)!
			)
		);

		newGeneralTransferObject.root.push(state.elementTranslation.get(rootElement)!);
		newGeneralTransferObject.parent.push(state.elementTranslation.get(domElement.parentElement!)!);
		newGeneralTransferObject.type.push(elementType);
		newGeneralTransferObject.affectedBy.push([...affectedByMainElements]);
		newGeneralTransferObject.ratio.push(getRatio(domElement));
		newGeneralTransferObject._keys.push(elementString);
	});
	state.generalTransferObject = newGeneralTransferObject;
};
