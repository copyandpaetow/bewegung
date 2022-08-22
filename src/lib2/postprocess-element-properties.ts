import { calculatedElementProperties } from "./types";

export const recalculateDisplayNoneValues = (
	elementProperties: calculatedElementProperties[]
): calculatedElementProperties[] => {
	if (
		elementProperties.every((entry) => entry.computedStyle.display !== "none")
	) {
		return elementProperties;
	}

	return elementProperties.map((entry, index, array) => {
		if (entry.computedStyle.display !== "none") {
			return entry;
		}
		const nextEntryDimensions = (
			array
				.slice(0, index)
				.reverse()
				.find((entry) => entry.computedStyle.display !== "none") ||
			array.slice(index).find((entry) => entry.computedStyle.display !== "none")
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
