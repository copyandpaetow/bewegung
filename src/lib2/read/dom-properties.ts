import { ElementReadouts, CssRuleName, PartialDomRect } from "../types";

const getComputedStylings = (
	changeProperties: CssRuleName[],
	element: HTMLElement
): Partial<CSSStyleDeclaration> => {
	const computedElementStyle = window.getComputedStyle(element);

	const relevantStyles: Partial<CSSStyleDeclaration> = {};

	changeProperties.forEach((cssRule: CssRuleName) => {
		//@ts-expect-error length/parentRule weirdness
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return computedElementStyle;
};

const getDomRect = (domElement: HTMLElement): PartialDomRect => {
	const { top, right, bottom, left, width, height } = domElement.getBoundingClientRect();

	return { top, right, bottom, left, width, height };
};

export const getCalculations = (
	element: HTMLElement,
	changeProperties: CssRuleName[]
): ElementReadouts => ({
	dimensions: getDomRect(element),
	computedStyle: getComputedStylings(changeProperties, element),
});
