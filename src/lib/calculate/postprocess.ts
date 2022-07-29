import { calculatedElementProperties } from "../types";
import { state_elementProperties } from "./calculate";

export const recalculateDisplayNoneValues = (
	element: HTMLElement
): calculatedElementProperties[] => {
	const existingCalculations = state_elementProperties.get(element)!;

	if (
		existingCalculations.every(
			(entry) => entry.computedStyle.display !== "none"
		)
	) {
		return existingCalculations;
	}

	return existingCalculations.map((entry, index, array) => {
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
