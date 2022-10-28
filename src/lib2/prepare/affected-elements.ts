import { scheduleCallback } from "../scheduler";
import { BewegungsOptions, State } from "../types";

const DOM = {
	parent(element: HTMLElement) {
		return element.parentElement as HTMLElement;
	},
	siblings(element: HTMLElement) {
		return Array.from(DOM.parent(element).children) as HTMLElement[];
	},
	decendants(element: HTMLElement) {
		return Array.from(element.querySelectorAll("*")) as HTMLElement[];
	},
	ancestors(element: HTMLElement, rootElement: HTMLElement, elementMap: HTMLElement[] = []) {
		if (rootElement === element) {
			return elementMap.concat(element);
		}
		return DOM.ancestors(DOM.parent(element), rootElement, elementMap.concat(element));
	},
};

export const findAffectedDOMElements = (
	element: HTMLElement,
	rootElement: HTMLElement
): HTMLElement[] => {
	//TODO this could be done with ":has() as well if support gets better"
	const parents = DOM.ancestors(DOM.parent(element), rootElement).flatMap((relatedElement) =>
		DOM.siblings(relatedElement)
	);

	return [...DOM.decendants(element), ...parents] as HTMLElement[];
};

const compareRootElements = (current: HTMLElement, previous: HTMLElement | undefined) => {
	if (!previous || current.contains(previous)) {
		return current;
	}
	if (previous.contains(current)) {
		return previous;
	}
	//here they are either siblings or the same element
	return current;
};

const getRootElement = (rootSelectors: string[]): HTMLElement => {
	let root: HTMLElement | undefined;

	rootSelectors.forEach((selector) => {
		const rootElement = document.querySelector(selector) as HTMLElement | null;

		if (!rootElement) {
			throw new Error("no root element with that selector");
		}

		root = compareRootElements(rootElement, root);
	});
	return root as HTMLElement;
};

export const computeSecondaryProperties = (state: State) => {
	const { mainElements, secondaryElements, options, rootElement } = state;

	mainElements.forEach((mainElement) => {
		const root = getRootElement(options.get(mainElement)!.map((option) => option.rootSelector));

		rootElement.set(mainElement, root);

		findAffectedDOMElements(mainElement, root).forEach((secondaryElement) => {
			if (mainElements.has(secondaryElement)) {
				return;
			}
			secondaryElements.add(secondaryElement);

			rootElement.set(
				secondaryElement,
				compareRootElements(root, rootElement.get(secondaryElement))
			);

			//TODO this currently causes the secondary elements to have a lot of duplicates, so it could be a set
			options.set(
				secondaryElement,
				(options.get(secondaryElement) ?? []).concat(options.get(mainElement)!)
			);
		});
	});
};
