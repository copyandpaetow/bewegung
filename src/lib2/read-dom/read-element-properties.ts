import { CssRuleName, PartialDomRect } from "../types";

export const getComputedStylings = (
	changeProperties: CssRuleName[],
	element: HTMLElement
): Partial<CSSStyleDeclaration> => {
	const computedElementStyle = window.getComputedStyle(element);

	const relevantStyles: Partial<CSSStyleDeclaration> = {};

	changeProperties.forEach((cssRule: CssRuleName) => {
		//@ts-expect-error length/parentRule weirdness
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return relevantStyles;
};

export const getDomRect = (domElement: HTMLElement): PartialDomRect => {
	const { top, right, bottom, left, width, height } =
		domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height };
};
