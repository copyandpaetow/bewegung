import { defaultChangeProperties, defaultImageChangeProperties } from "./utils/constants";
import { BidirectionalMap } from "./utils/element-translations";
import { DefaultReadouts, ImageReadouts } from "./types";

const getElementDimensions = (element: HTMLElement, optionalStyles = {}) => {
	const { top, left, width, height } = element.getBoundingClientRect();

	const relevantStyles = {
		currentTop: top,
		currentLeft: left,
		unsaveWidth: width,
		unsaveHeight: height,
		currentWidth: width,
		currentHeight: height,
		...optionalStyles,
	};

	return relevantStyles;
};

const getElementStyles = (
	element: HTMLElement,
	defaultProperties: Record<string, string>,
	optionalStyles = {}
) => {
	const computedElementStyle = window.getComputedStyle(element);

	return Object.entries(defaultProperties).reduce((accumulator, [key, property]) => {
		accumulator[key] = computedElementStyle.getPropertyValue(property);
		return accumulator;
	}, optionalStyles);
};

export const saveImageReadout = (imageElements: Map<string, HTMLElement>, offset: number) => {
	const imageChange = new Map<string, ImageReadouts>();

	imageElements.forEach((domElement, key) => {
		const ratio =
			(domElement as HTMLImageElement).naturalWidth /
			(domElement as HTMLImageElement).naturalHeight;
		const relevantStyles = getElementDimensions(domElement, { offset, ratio });

		imageChange.set(
			key,
			getElementStyles(domElement, defaultImageChangeProperties, relevantStyles) as ImageReadouts
		);
	});
	return imageChange;
};

export const saveDefaultReadout = (defaultElements: Map<string, HTMLElement>, offset: number) => {
	const defaultChange = new Map<string, DefaultReadouts>();

	defaultElements.forEach((domElement, key) => {
		const relevantStyles = getElementDimensions(domElement, { offset });

		defaultChange.set(
			key,
			getElementStyles(domElement, defaultChangeProperties, relevantStyles) as DefaultReadouts
		);
	});
	return defaultChange;
};

const isTextNode = (element: HTMLElement) => {
	return (
		element.childNodes.length > 0 &&
		Array.from(element.childNodes).some(
			(node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim().length > 0
		)
	);
};

export const seperateElementReadouts = (translations: BidirectionalMap<string, HTMLElement>) => {
	const textElements = new Map<string, HTMLElement>();
	const imageElements = new Map<string, HTMLElement>();
	const defaultElements = new Map<string, HTMLElement>();

	translations.forEach((domElement, key) => {
		if (!domElement.isConnected) {
			return;
		}
		if (domElement.tagName === "IMG") {
			imageElements.set(key, domElement);
		}
		if (isTextNode(domElement)) {
			textElements.set(key, domElement);
		}
		defaultElements.set(key, domElement);
	});

	return { textElements, imageElements, defaultElements };
};
