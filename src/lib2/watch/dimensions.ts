import {
	calculatedElementProperties,
	ChunkState,
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
	let allIntersectionObserver = new WeakMap<
		HTMLElement,
		IntersectionObserver
	>();

	elementState.getAllElements().forEach((element) => {
		allIntersectionObserver.get(element)?.disconnect();

		const mainElements = elementState.isMainElement(element)
			? [element]
			: [...elementState.getDependecyElements(element)!];

		const allSelectors = mainElements.flatMap(
			(mainElement) => chunkState.getSelector(mainElement)!
		);

		const rootElement = getRootElement(element, allSelectors);

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
					styleState.getElementProperties(element)!
				),
			}
		);

		observer.observe(element);
		allIntersectionObserver.set(element, observer);
	});

	return {
		disconnect: () => {
			elementState.getAllElements().forEach((element) => {
				allIntersectionObserver.get(element)?.disconnect();
			});
			allIntersectionObserver = new WeakMap<
				HTMLElement,
				IntersectionObserver
			>();
		},
	};
};
