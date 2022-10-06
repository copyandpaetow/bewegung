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

	return relevantStyles;
};

const getDomRect = (domElement: HTMLElement): PartialDomRect => {
	const { top, right, bottom, left, width, height } = domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height };
};

export const getCalculations = (
	element: HTMLElement,
	timing: number,
	changeProperties: CssRuleName[]
): ElementReadouts => ({
	dimensions: getDomRect(element),
	offset: timing,
	computedStyle: getComputedStylings(changeProperties, element),
	naturalRatio:
		element.tagName !== "IMG"
			? undefined
			: (element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight,
});
