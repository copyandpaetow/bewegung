import { CssRuleName, ElementReadouts, PartialDomRect } from "../types";

export const getRatio = (domElement: HTMLElement): number =>
	domElement.tagName !== "IMG"
		? 0
		: (domElement as HTMLImageElement).naturalWidth /
		  (domElement as HTMLImageElement).naturalHeight;

export const getCalculations = (
	element: HTMLElement,
	changeProperties: CssRuleName[],
	timing: number
): ElementReadouts => {
	const { top, left, width, height } = element.getBoundingClientRect();
	const computedElementStyle = window.getComputedStyle(element);

	const relevantStyles = {
		currentTop: top,
		currentLeft: left,
		unsaveWidth: width,
		unsaveHeight: height,
		currentWidth: width,
		currentHeight: height,
		offset: timing,
	};

	//TODO if `getPropertyValue(rule)` is faster, we need to resturcture the changeProperties to be border-radius instead of borderRadius for example
	changeProperties.forEach((cssRule: CssRuleName) => {
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return relevantStyles;
};