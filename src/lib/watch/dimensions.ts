import {
	calculatedElementProperties,
	ChunkState,
	ElementKey,
	ElementState,
	StyleState,
} from "../types";

export const getRootElement = (
	element: HTMLElement,
	allSelectors: string[]
) => {
	const selectors = new Set<string>(allSelectors);

	if (selectors.size === 0) {
		return document.body;
	}

	let currentElement = element?.parentElement;
	let match: HTMLElement | undefined;

	while (currentElement && !match) {
		selectors.forEach((selector) => {
			if (currentElement?.matches(selector)) {
				match = currentElement;
			}
		});
		currentElement = currentElement.parentElement;
	}
	return match || document.body;
};

const calculateRootMargin = (
	rootElement: HTMLElement,
	elementProperties: calculatedElementProperties[]
) => {
	const { clientWidth, clientHeight } = rootElement;
	const { dimensions } = elementProperties[0];
	const buffer = 5;

	const rootMargins = [
		dimensions.top,
		clientWidth - dimensions.right,
		clientHeight - dimensions.bottom,
		dimensions.left,
	];

	return rootMargins.map((px) => `${-1 * Math.floor(px - buffer)}px`).join(" ");
};

export const ObserveDimensionChange = (
	chunkState: ChunkState,
	elementState: ElementState,
	styleState: StyleState,
	callback: () => void
) => {
	let allIntersectionObserver = new WeakMap<ElementKey, IntersectionObserver>();

	elementState.getAllKeys().forEach((key) => {
		allIntersectionObserver.get(key)?.disconnect();
		const domElement = elementState.getDomElement(key);

		const mainKeys = key.mainElement
			? [key]
			: [...elementState.getDependecyKeys(key)!];

		const allSelectors = mainKeys.flatMap(
			(key) => chunkState.getSelector(key)!
		);

		const rootElement = getRootElement(domElement, allSelectors);

		let firstTime = true;
		const observer = new IntersectionObserver(
			() => {
				if (firstTime) {
					firstTime = false;
					return;
				}
				callback();
			},
			{
				root: rootElement,
				threshold: [0.2, 0.4, 0.6, 0.8, 1],
				rootMargin: calculateRootMargin(
					rootElement,
					styleState.getElementProperties(key)!
				),
			}
		);

		observer.observe(domElement);
		allIntersectionObserver.set(key, observer);
	});

	return {
		disconnect: () => {
			elementState.getAllKeys().forEach((key) => {
				allIntersectionObserver.get(key)?.disconnect();
			});
			allIntersectionObserver = new WeakMap<ElementKey, IntersectionObserver>();
		},
	};
};
