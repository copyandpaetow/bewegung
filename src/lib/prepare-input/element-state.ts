import { Chunks, ElementKey, ElementState } from "../types";
import { BiMap } from "./bimap";
import { findAffectedDOMElements } from "./find-affected-elements";

interface StatefulElements {
	mainElements: BiMap<ElementKey, HTMLElement>;
	affectedElements: BiMap<ElementKey, HTMLElement>;
	dependencyElements: WeakMap<ElementKey, ElementKey[]>;
}

export const findAffectedAndDependencyElements = (
	chunks: Chunks[]
): StatefulElements => {
	const mainElements = new BiMap<ElementKey, HTMLElement>();
	const affectedElements = new BiMap<ElementKey, HTMLElement>();

	const dependencyElements = new WeakMap<ElementKey, ElementKey[]>();

	chunks.forEach(({ target }) => {
		target.forEach((element) =>
			mainElements.set({ mainElement: true }, element)
		);
	});

	chunks.forEach(({ target, options }) => {
		target.forEach((mainElement) => {
			findAffectedDOMElements(mainElement, options?.rootSelector).forEach(
				(affectedElement) => {
					if (mainElements.has(affectedElement)) {
						return;
					}
					const affectedKey = { mainElement: false };
					const mainKey = mainElements.get(mainElement)!;
					affectedElements.set(affectedKey, affectedElement);

					dependencyElements.set(
						affectedKey,
						(dependencyElements.get(affectedKey) || []).concat(mainKey)
					);
				}
			);
		});
	});

	return { mainElements, affectedElements, dependencyElements };
};

export const getElementState = ({
	mainElements,
	affectedElements,
	dependencyElements,
}: StatefulElements): ElementState => {
	return {
		getMainKeys() {
			return mainElements.keys();
		},
		getAllKeys() {
			return mainElements.keys().concat(affectedElements.keys());
		},
		getDependecyKeys(key: ElementKey) {
			return dependencyElements.get(key);
		},
		getDomElement(key: ElementKey): HTMLElement {
			const domElement = mainElements.get(key) || affectedElements.get(key);

			if (!domElement) {
				throw new Error("key element translation is out of sync");
			}

			return domElement;
		},
		hasKey(element: HTMLElement) {
			return Boolean(
				mainElements.get(element) || affectedElements.get(element)
			);
		},
		getKey(element: HTMLElement) {
			const key = mainElements.get(element) || affectedElements.get(element);

			if (!key) {
				throw new Error("key element translation is out of sync");
			}

			return key;
		},
	};
};
