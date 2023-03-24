import { ElementOrSelector } from "../types";

const findElementsByString = (selector: string) => {
	const getFromSelector = document.querySelectorAll(selector);
	if (getFromSelector.length === 0) {
		throw new Error("There is no selector with that name");
	}

	return [...getFromSelector] as HTMLElement[];
};

const QUERYSTRING = "bewegung-getelement";

const convertToElementArray = (element: Element): HTMLElement[] => {
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
			element instanceof HTMLElement ? element : convertToElementArray(element)
		);
	}

	return convertToElementArray(elements as HTMLElement);
};
