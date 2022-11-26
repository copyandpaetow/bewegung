import { CustomKeyframeEffect, ElementOrSelector } from "../types";
import { BidirectionalMap, uuid } from "../utils";
import { findAffectedDOMElements, getRootElement } from "./affected-elements";

const findElementsByString = (selector: string) => {
	const getFromSelector = document.querySelectorAll(selector);
	if (getFromSelector.length === 0) {
		throw new Error("There is no selector with that name");
	}

	return [...getFromSelector] as HTMLElement[];
};

const QUERYSTRING = "bewegung-getelement";

const convertToElementArray = (element: HTMLElement): HTMLElement[] => {
	element.setAttribute(QUERYSTRING, "");

	const newNodeList = document.querySelectorAll(`[${QUERYSTRING}]`);
	element.removeAttribute(QUERYSTRING);

	return Array.from(newNodeList) as HTMLElement[];
};

export const normalizeElements = (elements: ElementOrSelector): HTMLElement[] => {
	if (typeof elements === "string") {
		return findElementsByString(elements);
	}

	if (elements instanceof NodeList) {
		return [...elements] as HTMLElement[];
	}

	if (Array.isArray(elements)) {
		return elements.flatMap((element) =>
			element instanceof HTMLElement ? element : convertToElementArray(element as HTMLElement)
		);
	}

	return convertToElementArray(elements as HTMLElement);
};

export const getElements = (normalizedProps: CustomKeyframeEffect[], chunkIDs: string[]) => {
	const elementLookup = new BidirectionalMap<string, HTMLElement>();
	const elements = new Map<string, string[]>();
	const selectors = new Map<string, string>();

	normalizedProps.forEach((propEntry, index) => {
		const elementsFromProps = propEntry[0];
		const htmlElements = normalizeElements(elementsFromProps);
		const chunkID = chunkIDs[index];
		const elementStrings: string[] = [];

		htmlElements.forEach((mainElement) => {
			if (elementLookup.has(mainElement)) {
				const key = elementLookup.get(mainElement)!;
				elementStrings.push(key);
			} else {
				const key = uuid("main");
				elementLookup.set(key, mainElement);
				elementStrings.push(key);
			}
		});
		elements.set(chunkID, elementStrings);

		if (typeof elementsFromProps === "string") {
			selectors.set(chunkID, elementsFromProps);
		}
	});

	return { elementLookup, elements, selectors };
};
