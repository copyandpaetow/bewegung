import { ElementOrSelector } from "../types";

const findElementsByString = (elementString: string) => {
	const getFromSelector = document.querySelectorAll(elementString);
	if (getFromSelector.length === 0) {
		throw new Error("There is no selector with that name");
	}

	return new Set([...getFromSelector] as HTMLElement[]);
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
): Set<HTMLElement> => {
	if (typeof elementOrElements === "string") {
		return findElementsByString(elementOrElements);
	}

	if (elementOrElements instanceof NodeList) {
		return new Set([...elementOrElements] as HTMLElement[]);
	}

	if (Array.isArray(elementOrElements)) {
		const elementArray = elementOrElements.flatMap((element) => {
			return element instanceof HTMLElement
				? element
				: convertToElementArray(element as HTMLElement);
		});
		return new Set(elementArray);
	}

	return new Set(convertToElementArray(elementOrElements as HTMLElement));
};
