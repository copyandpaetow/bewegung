import { CssRuleName, ElementReadouts } from "../types";

export const getCalculations = (
	element: HTMLElement,
	changeProperties: Set<CssRuleName>,
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

	changeProperties.forEach((cssRule: CssRuleName) => {
		relevantStyles[cssRule] = computedElementStyle[cssRule];
	});

	return relevantStyles;
};
