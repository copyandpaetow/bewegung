import { BewegungsOptions } from "../types";

const getParent = (element: HTMLElement) =>
	element.parentElement || document.body;

const getSiblings = (element: HTMLElement): HTMLElement[] => {
	if (
		!element?.parentElement?.children ||
		element?.parentElement.tagName === "BODY"
	) {
		return [];
	}
	return Array.from(element.parentElement.children) as HTMLElement[];
};

const traverseDomUp = (
	element: HTMLElement,
	rootSelector?: string,
	elementMap?: HTMLElement[]
): HTMLElement[] => {
	const parent = getParent(element);
	const elements = (elementMap || []).concat(element);

	if (
		(rootSelector && element.matches(rootSelector)) ||
		parent.tagName === "BODY"
	) {
		return elements;
	}

	return traverseDomUp(parent, rootSelector, elements);
};

export const traverseDomDown = (element: HTMLElement): HTMLElement[] => {
	return Array.from(element.querySelectorAll("*"));
};

export const findAffectedDOMElements = (
	element: HTMLElement,
	rootSelector?: string
): HTMLElement[] => {
	const parents = traverseDomUp(element, rootSelector).flatMap(
		(relatedElement) => getSiblings(relatedElement)
	);

	return [...traverseDomDown(element), ...parents] as HTMLElement[];
};

export const getAffectedElements = (
	mainElements: HTMLElement[][],
	options: BewegungsOptions[]
): HTMLElement[][] => {
	const allMainElements = mainElements.flat();

	return mainElements.map((mainElementArray, index) => {
		const elementSet = new Set(
			mainElementArray.flatMap((element) =>
				findAffectedDOMElements(element, options[index].rootSelector)
			)
		);
		allMainElements.forEach((element) => {
			elementSet.has(element) && elementSet.delete(element);
		});

		return Array.from(elementSet);
	});
};
