import { Chunks } from "../types";
import { findAffectedDOMElements } from "./find-affected-elements";

interface StatefulElements {
	mainElements: Set<HTMLElement>;
	affectedElements: Set<HTMLElement>;
	dependencyElements: WeakMap<HTMLElement, Set<HTMLElement>>;
}

export const findAffectedAndDependencyElements = (
	chunks: Chunks[]
): StatefulElements => {
	const mainElements = new Set<HTMLElement>();
	const affectedElements = new Set<HTMLElement>();
	const dependencyElements = new WeakMap<HTMLElement, Set<HTMLElement>>();

	chunks.forEach(({ target }) => {
		target.forEach((element) => mainElements.add(element));
	});

	chunks.forEach(({ target, options }) => {
		target.forEach((element) => {
			findAffectedDOMElements(element, options?.rootSelector).forEach(
				(affectedElement) => {
					if (mainElements.has(affectedElement)) {
						return;
					}
					affectedElements.add(affectedElement);
					dependencyElements.set(
						affectedElement,
						(dependencyElements.get(affectedElement) || new Set()).add(element)
					);
				}
			);
		});
	});

	return { mainElements, affectedElements, dependencyElements };
};

export interface ElementState {
	getMainElements(): Set<HTMLElement>;
	isMainElement(element: HTMLElement): boolean;
	getAllElements(): HTMLElement[];
	getDependecyElements(element: HTMLElement): Set<HTMLElement> | undefined;
}

export const getElementState = ({
	mainElements,
	affectedElements,
	dependencyElements,
}: StatefulElements): ElementState => {
	return {
		getMainElements() {
			return mainElements;
		},
		isMainElement(element: HTMLElement) {
			return mainElements.has(element);
		},
		getAllElements() {
			return [...mainElements, ...affectedElements];
		},
		getDependecyElements(element: HTMLElement) {
			return dependencyElements.get(element);
		},
	};
};
