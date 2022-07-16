import { cssRuleName, ValueOf } from "../types";

const transformCSSValues = (
	key: cssRuleName,
	value: ValueOf<CSSStyleDeclaration>,
	computedStyle: CSSStyleDeclaration
): ValueOf<CSSStyleDeclaration> => {
	const { width, height } = computedStyle;
	switch (key) {
		case "borderRadius":
			if (value === "0px") {
				return value;
			}
			if ((value as string).split(" ").length !== 1) {
				return value;
			}
			const numHeight = parseFloat(height);
			const numWidth = parseFloat(width);
			const parsedValue = parseFloat(value as string);

			return `${(100 * parsedValue) / numWidth}% / ${
				(100 * parsedValue) / numHeight
			}%`;

		default:
			return value;
	}
};

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
		//@ts-expect-error indexing
		const currentRule = computedElementStyle[cssRule];
		//@ts-expect-error length/parentRule weirdness
		relevantStyles[cssRule] = transformCSSValues(
			cssRule,
			currentRule,
			computedElementStyle
		);
	});

	return relevantStyles;
};

export const getDomRect = (domElement: HTMLElement): DOMRect => {
	const { top, right, bottom, left, width, height, x, y, toJSON } =
		domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height, x, y, toJSON };
};
