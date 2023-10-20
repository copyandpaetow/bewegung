import { DimensionalDifferences, Display, ObjectFit, Result, TreeElement } from "../types";

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

export const containRootChanges = (rootResult: Result | undefined) => {
	if (!rootResult) {
		return;
	}

	const overrides = (rootResult[1] ??= {});
	overrides.contain = "layout inline-size";
};

export const isEntryVisible = (entry: TreeElement) =>
	entry.display !== Display.none && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;
