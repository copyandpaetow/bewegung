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

export const changesInScale = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.heightDifference !== entry.widthDifference &&
			(entry.heightDifference !== 1 || entry.widthDifference !== 1)
	);

export const isImage = (currentDimensions: [TreeEntry, TreeEntry]) =>
	currentDimensions[1].hasOwnProperty("ratio");
