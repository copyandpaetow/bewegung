import { DimensionalDifferences, ObjectFit, TreeElement } from "../types";

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

export const isCurrentlyInViewport = (dimensions: [TreeElement, TreeElement]) =>
	dimensions.some((entry) => entry.visibility);
