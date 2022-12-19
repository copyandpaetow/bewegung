import { CssRuleName, ElementReadouts, PartialDomRect } from "../types";

const getComputedStylings = (
	changeProperties: CssRuleName[],
	element: HTMLElement
): Partial<CSSStyleDeclaration> => {
	const computedElementStyle = window.getComputedStyle(element);

	const relevantStyles: Partial<CSSStyleDeclaration> = {};

	//TODO if `getPropertyValue(rule)` is faster, we need to resturcture the changeProperties to be border-radius instead of borderRadius for example
	changeProperties.forEach((cssRule: CssRuleName) => {
		//@ts-expect-error length/parentRule weirdness
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return relevantStyles;
};

const getDomRect = (domElement: HTMLElement): PartialDomRect => {
	const { top, left, width, height } = domElement.getBoundingClientRect();

	return { top, left, width, height };
};

export const getRatio = (domElement: HTMLElement): number => {
	if (domElement.tagName !== "IMG") {
		return 0;
	}

	return (
		(domElement as HTMLImageElement).naturalWidth / (domElement as HTMLImageElement).naturalHeight
	);
};

export const getCalculations = (
	element: HTMLElement,
	changeProperties: CssRuleName[],
	timing: number
): ElementReadouts => ({
	dimensions: getDomRect(element),
	computedStyle: getComputedStylings(changeProperties, element),
	offset: timing,
});
