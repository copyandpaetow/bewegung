import { DimensionalDifferences, TreeEntry } from "../types";

export const isEntryVisible = (entry: TreeEntry) =>
	entry.display !== "none" &&
	entry.display !== "" &&
	entry.unsaveWidth !== 0 &&
	entry.unsaveHeight !== 0;

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const isElementUnchanged = ({
	leftDifference,
	topDifference,
	widthDifference,
	heightDifference,
}: DimensionalDifferences) =>
	leftDifference === 0 && topDifference === 0 && widthDifference === 1 && heightDifference === 1;

export const isHiddenBecauseOfParent = ({
	leftDifference,
	topDifference,
	widthDifference,
	heightDifference,
}: DimensionalDifferences) => {
	const samePosition = leftDifference === 0 && topDifference === 0;
	const hiddenOrDefaultWidth = widthDifference === 1 || widthDifference === 0;
	const hiddenOrDefaultHeight = heightDifference === 1 || heightDifference === 0;

	return samePosition && hiddenOrDefaultWidth && hiddenOrDefaultHeight;
};
