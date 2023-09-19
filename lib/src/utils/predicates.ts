import { DimensionalDifferences, Display, DomElement, TreeElement } from "../types";

export const isEntryVisible = (entry: TreeElement) =>
	entry.display !== Display.none && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const isDomEntryVisible = (entry: DomElement) =>
	entry.display !== Display.none && entry.currentHeight !== 0 && entry.currentWidth !== 0;

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const isElementUnchanged = ({
	leftDifference,
	topDifference,
	widthDifference,
	heightDifference,
}: DimensionalDifferences) =>
	leftDifference === 0 && topDifference === 0 && widthDifference === 1 && heightDifference === 1;

export const changesInScale = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.heightDifference !== entry.widthDifference &&
			(entry.heightDifference !== 1 || entry.widthDifference !== 1)
	);

export const isImage = (currentDimensions: [TreeElement, TreeElement]) =>
	Boolean(currentDimensions[1].ratio);
