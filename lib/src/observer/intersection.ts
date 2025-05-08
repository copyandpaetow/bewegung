import { Readout } from "../element/readout";

const getMargins = (readout: Readout, parentReadout: Readout) => {
	const [left, top, width, height] = readout.dimensions;
	const [parentLeft, parentTop, parentWidth, parentHeight] =
		parentReadout.dimensions;

	const relTop = top - parentTop;
	const relLeft = left - parentLeft;
	const relBottom = parentTop + parentHeight - (top + height);
	const relRight = parentLeft + parentWidth - (left + width);

	const buffer = 5;
	const rootMargin =
		`${-(relTop - buffer)}px ` +
		`${-(relRight - buffer)}px ` +
		`${-(relBottom - buffer)}px ` +
		`${-(relLeft - buffer)}px`;

	return rootMargin;
};

export const getIntersectionOptions = (
	element: Element,
	dimensions: Map<Element, Readout>
): IntersectionObserverInit => {
	const elementReadout = dimensions.get(element)!;
	const parentReadout = dimensions.get(element.parentElement!)!;

	return {
		root: element.parentElement,
		rootMargin: getMargins(elementReadout, parentReadout), //TODO: we need to reset them after each animation
		threshold: 1,
	};
};

export const MO_OPTIONS = {
	attributes: true,
	childList: true,
	subtree: true,
};
