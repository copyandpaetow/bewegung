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

export const changesAspectRatio = (
	dimensions: [TreeElement, TreeElement],
	differences: DimensionalDifferences[]
) => {
	const sameWidth = dimensions[0].currentWidth === dimensions[1].currentWidth;
	const sameHeight = dimensions[0].currentHeight === dimensions[1].currentHeight;

	if (sameHeight && sameWidth) {
		return false;
	}

	return differences.some((entry) => entry.heightDifference !== entry.widthDifference);
};

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

export const isElementUnanimated = (keyframes: Keyframe[]) =>
	keyframes.every((frame) => frame.transform === "translate(0px, 0px) scale(1, 1)");
