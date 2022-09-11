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

	const includingChildren = [...traverseDomDown(element), ...parents].filter(
		(entry) => entry !== element
	);

	return includingChildren as HTMLElement[];
};
