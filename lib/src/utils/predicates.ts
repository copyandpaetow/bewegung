import { DimensionalDifferences, Display, ObjectFit, TreeElement } from "../types";

export const isEntryVisible = (entry: TreeElement) =>
	entry.display !== Display.none && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const isElementChanged = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.leftDifference !== 0 ||
			entry.topDifference !== 0 ||
			entry.widthDifference !== 1 ||
			entry.heightDifference !== 1
	);

export const changesInScale = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.heightDifference !== entry.widthDifference &&
			(entry.heightDifference !== 1 || entry.widthDifference !== 1)
	);

export const hasObjectFit = (dimensions: [TreeElement, TreeElement]) =>
	dimensions.some((entry) => entry.objectFit !== ObjectFit.fill);

const replacedInlineElements = ["IMG", "VIDEO", "CANVAS"];

export const isNonReplacementInlineElement = (dimensions: [TreeElement, TreeElement]) => {
	if (dimensions.some((entry) => entry.display !== Display.inline)) {
		return false;
	}
	return replacedInlineElements.every((replacement) => !dimensions[0].key.includes(replacement));
};

export const isCurrentlyInViewport = (dimensions: [TreeElement, TreeElement]) =>
	dimensions.some((entry) => entry.visibility);
