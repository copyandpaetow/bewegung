import { calculatedElementProperties } from "./types";

const isEntryVisible = (entry: calculatedElementProperties) =>
	entry.computedStyle.display !== "none" &&
	entry.dimensions.height !== 0 &&
	entry.dimensions.width !== 0;

export const recalculateDisplayNoneValues = (
	elementProperties: calculatedElementProperties[]
): calculatedElementProperties[] => {
	if (elementProperties.every(isEntryVisible)) {
		return elementProperties;
	}

	return elementProperties.map((entry, index, array) => {
		if (isEntryVisible(entry)) {
			return entry;
		}
		const nextEntryDimensions = (
			array.slice(0, index).reverse().find(isEntryVisible) ||
			array.slice(index).find(isEntryVisible)
		)?.dimensions;

		if (!nextEntryDimensions) {
			return entry;
		}

		return {
			...entry,
			dimensions: { ...nextEntryDimensions, width: 0, height: 0 },
		};
	});
};
