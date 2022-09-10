import { Chunks, ElementCallback, ElementKey, ElementState } from "../types";
import { BiMap } from "./bimap";
import { findAffectedDOMElements } from "./find-affected-elements";

interface StatefulElements {
	mainElements: BiMap<ElementKey, HTMLElement>;
	affectedElements: BiMap<ElementKey, HTMLElement>;
	dependencyElements: WeakMap<ElementKey, Set<ElementKey>>;
	chunkMap: WeakMap<ElementKey, Chunks>;
}

export const findAffectedAndDependencyElements = (
	chunks: Chunks[]
): StatefulElements => {
	const mainElements = new BiMap<ElementKey, HTMLElement>();
	const affectedElements = new BiMap<ElementKey, HTMLElement>();
	const dependencyElements = new WeakMap<ElementKey, Set<ElementKey>>();
	const chunkMap = new WeakMap<ElementKey, Chunks>();
	const elementGroupMap = new WeakMap<ElementKey, Record<string, string>>();

	chunks.forEach((chunk) => {
		const chunkKey = {};
		chunk.target.forEach((element) => {
			const key = { mainElement: true };
			mainElements.set(key, element);
			elementGroupMap.set(key, chunkKey);
			chunkMap.set(key, chunk);
		});
	});

	chunks.forEach(({ target, options }) => {
		target.forEach((mainElement) => {
			findAffectedDOMElements(mainElement, options?.rootSelector).forEach(
				(affectedElement) => {
					if (mainElements.hasByValue(affectedElement)) {
						return;
					}

					let affectedKey: ElementKey = { mainElement: false };

					if (!affectedElements.hasByValue(affectedElement)) {
						affectedElements.set(affectedKey, affectedElement);
					} else {
						affectedKey = affectedElements.getByValue(affectedElement)![0];
					}

					const dependencyKeys =
						dependencyElements.get(affectedKey) || new Set();
					mainElements
						.getByValue(mainElement)!
						.forEach((mainKey) => dependencyKeys.add(mainKey));

					dependencyElements.set(affectedKey, dependencyKeys);
				}
			);
		});
	});

	return {
		mainElements,
		affectedElements,
		dependencyElements,
		chunkMap,
	};
};

export const getElementState = ({
	mainElements,
	affectedElements,
	dependencyElements,
	chunkMap,
}: StatefulElements): ElementState => {
	const getKeys = (element: HTMLElement) => {
		return mainElements.getByValue(element) ?? [];
	};

	const getData = (keys: ElementKey[]) => {
		const data = new Set<Chunks>();

		keys.forEach((key) => {
			if (!chunkMap.has(key)) {
				return;
			}
			data.add(chunkMap.get(key)!);
		});

		return Array.from(data);
	};

	return {
		forEachMain(callback: ElementCallback) {
			mainElements.forEach(callback);
		},
		forEach(callback: ElementCallback) {
			mainElements.forEach(callback);
			affectedElements.forEach(callback);
		},
		getDependecyOptions(element: HTMLElement) {
			const keys = getKeys(element).flatMap((key) => {
				if (!dependencyElements.has(key)) {
					return [];
				}
				return [...dependencyElements.get(key)!];
			});
			return getData(keys).flatMap((chunk) => chunk.options);
		},
		getDependecySelectors(element: HTMLElement) {
			const keys = getKeys(element).flatMap((key) => {
				if (!dependencyElements.has(key)) {
					return [];
				}
				return [...dependencyElements.get(key)!];
			});
			return getData(keys).flatMap((chunk) => chunk.selector ?? []);
		},
		getKeyframes(element: HTMLElement) {
			return getData(getKeys(element)).flatMap((chunk) => chunk.keyframes);
		},
		getOptions(element: HTMLElement) {
			return getData(getKeys(element)).flatMap((chunk) => chunk.options);
		},
		getCallbacks(element: HTMLElement) {
			return getData(getKeys(element)).flatMap(
				(chunk) => chunk.callbacks ?? []
			);
		},
		getSelectors(element: HTMLElement) {
			return getData(getKeys(element)).flatMap((chunk) => chunk.selector ?? []);
		},
		getKey(element: HTMLElement) {
			return (
				mainElements.getByValue(element) ?? affectedElements.getByValue(element)
			);
		},
	};
};
