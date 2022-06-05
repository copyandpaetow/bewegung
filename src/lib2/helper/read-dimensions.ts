import { cssRuleName } from "../types";

export const getComputedStylings = (
	changeProperties: cssRuleName[],
	element?: HTMLElement
): Partial<CSSStyleDeclaration> => {
	const style =
		element && document.body.contains(element)
			? window.getComputedStyle(element)
			: window.getComputedStyle(document.head); //an empty element that is mounted in the DOM

	const transformedProperties = changeProperties.reduce(
		(accumulator, current) => {
			if (!style[current as keyof CSSStyleDeclaration]) {
				return accumulator;
			}

			return {
				...accumulator,
				...{ [current]: style[current as keyof CSSStyleDeclaration] },
			};
		},
		{}
	);

	return transformedProperties;
};

export const getDomRect = (domElement: HTMLElement): DOMRect => {
	const { top, right, bottom, left, width, height, x, y, toJSON } =
		domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height, x, y, toJSON };
};
