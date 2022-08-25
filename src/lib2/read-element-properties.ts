import { cssRuleName } from "./types";

export const getComputedStylings = (
	changeProperties: cssRuleName[],
	element?: HTMLElement
): Partial<CSSStyleDeclaration> => {
	const computedElementStyle =
		element && document.body.contains(element)
			? window.getComputedStyle(element)
			: window.getComputedStyle(document.head); //an empty element that is mounted in the DOM

	const relevantStyles: Partial<CSSStyleDeclaration> = {};

	changeProperties.forEach((cssRule: cssRuleName) => {
		//@ts-expect-error length/parentRule weirdness
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return relevantStyles;
};

export const getDomRect = (domElement: HTMLElement): DOMRect => {
	const { top, right, bottom, left, width, height, x, y, toJSON } =
		domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height, x, y, toJSON };
};