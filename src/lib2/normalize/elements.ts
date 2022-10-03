import { ElementOrSelector } from "../types";

const findElementsByString = (elementString: string) => {
	const getFromSelector = document.querySelectorAll(elementString);
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

export const normalizeElements = (
	elementOrElements: ElementOrSelector
): HTMLElement[] => {
	if (typeof elementOrElements === "string") {
		return findElementsByString(elementOrElements);
	}

	if (elementOrElements instanceof NodeList) {
		return [...elementOrElements] as HTMLElement[];
	}

	if (Array.isArray(elementOrElements)) {
		return elementOrElements.flatMap((element) =>
			element instanceof HTMLElement
				? element
				: convertToElementArray(element as HTMLElement)
		);
	}

	return convertToElementArray(elementOrElements as HTMLElement);
};
