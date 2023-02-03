import { getOrAddKeyFromLookup } from "../shared/element-translations";
import { task } from "../shared/utils";
import { EntryType, MainState } from "../types";

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

const getAffectedElements = (state: MainState) => {
	const { translation, root, resets } = state;

	const affectedElementsMap = new Map<string, Set<string>>();
	const elementConnections = new Map<string, HTMLElement[]>();

	const mainElements = new Set(resets.keys());

	mainElements.forEach((domElement) => {
		const elementID = translation.get(domElement)!;
		const rootElement = root.get(domElement)!;

		elementConnections.set(elementID, findAffectedDOMElements(domElement, rootElement));
	});

	elementConnections.forEach((secondaryDomElements, mainElementID) => {
		secondaryDomElements.forEach((secondaryDomElement) => {
			const secondaryElementID = getOrAddKeyFromLookup(secondaryDomElement, translation);

			//TODO: remove
			secondaryDomElement.setAttribute("data-id", secondaryElementID);

			affectedElementsMap.set(
				secondaryElementID,
				(affectedElementsMap.get(secondaryElementID) ?? new Set<string>()).add(mainElementID)
			);
		});
	});

	return affectedElementsMap;
};

const getAffectedByElements = (affectedElementsMap: Map<string, Set<string>>, state: MainState) => {
	const { translation } = state;

	const affectedBy = new Map<string, string[]>();

	translation.forEach((_, elementID) => {
		const affectedByMainElements = affectedElementsMap.get(elementID)!;
		affectedBy.set(elementID, [...affectedByMainElements]);
	});

	return affectedBy;
};

const getRoot = (affectedElementsMap: Map<string, Set<string>>, state: MainState) => {
	const { translation, root } = state;
	const rootString = new Map<string, string>();

	translation.forEach((domElement, elementID) => {
		const affectedByMainElements = affectedElementsMap.get(elementID)!;
		const rootElement = getRootElement(
			Array.from(
				affectedByMainElements,
				(mainElementID: string) => root.get(translation.get(mainElementID)!)!
			)
		);
		root.set(domElement, rootElement);
		rootString.set(elementID, translation.get(rootElement)!);
	});

	return rootString;
};

const getParent = (state: MainState) => {
	const { translation } = state;
	const parent = new Map<string, string>();
	translation.forEach((domElement, elementID) => {
		parent.set(elementID, translation.get(domElement.parentElement!)!);
	});

	return parent;
};

export const getRatio = (state: MainState) => {
	const { translation } = state;
	const ratio = new Map<string, number>();

	translation.forEach((domElement, elementID) => {
		if (domElement.tagName !== "IMG") {
			return;
		}
		ratio.set(
			elementID,
			(domElement as HTMLImageElement).naturalWidth / (domElement as HTMLImageElement).naturalHeight
		);
	});
	return ratio;
};

const isTextNode = (element: HTMLElement) => {
	if (!element.hasChildNodes()) {
		return false;
	}

	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()))
		? "text"
		: false;
};

const getType = (state: MainState) => {
	const { translation } = state;
	const type = new Map<string, EntryType>();

	translation.forEach((domElement, elementID) => {
		if (domElement.tagName === "IMG") {
			type.set(elementID, "image");
		}

		if (isTextNode(domElement)) {
			type.set(elementID, "text");
		}
	});

	return type;
};

export const getGeneralTransferObject = async (state: MainState) => {
	const affectedElementsMap = getAffectedElements(state);
	await task();
	return {
		affectedBy: getAffectedByElements(affectedElementsMap, state),
		root: getRoot(affectedElementsMap, state),
		parent: getParent(state),
		ratio: getRatio(state),
		type: getType(state),
	};
};
