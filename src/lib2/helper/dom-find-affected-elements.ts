export const STOP_TRAVERSING_CLASS = "bewegung-stop-traversing";

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
	elementMap?: HTMLElement[]
): HTMLElement[] => {
	const elements = elementMap || [];
	const parent = getParent(element);

	if (element.tagName === "BODY") {
		return [...elements];
	}
	if (element.classList.contains(STOP_TRAVERSING_CLASS)) {
		return [element, ...elements];
	}

	return traverseDomUp(parent, [...elements, element]);
};

const traverseDomDown = (element: HTMLElement): HTMLElement[] => {
	return Array.from(element.querySelectorAll("*"));
};

export const findAffectedDOMElements = (
	element: HTMLElement
): HTMLElement[] => {
	const parents = traverseDomUp(element).flatMap((relatedElement) =>
		getSiblings(relatedElement)
	);

	const includingChildren = [...traverseDomDown(element), ...parents].filter(
		(entry) => entry !== element
	);

	return includingChildren as HTMLElement[];
};
