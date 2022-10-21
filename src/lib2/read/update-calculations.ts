import { scheduleCallback } from "../scheduler";
import { AnimationState, ElementReadouts } from "../types";

export const isEntryVisible = (entry: ElementReadouts) =>
	entry.computedStyle.display !== "none" &&
	entry.dimensions.height !== 0 &&
	entry.dimensions.width !== 0;

export const recalculateDisplayNoneValues = (readout: ElementReadouts[]): ElementReadouts[] => {
	if (readout.every(isEntryVisible)) {
		return readout;
	}

	return readout.map((entry, index, array) => {
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

export const adjustForDisplayNone = (animationState: AnimationState) => {
	const { readouts } = animationState;

	readouts.forEach((readout, element) => {
		scheduleCallback(() => {
			readouts.set(element, recalculateDisplayNoneValues(readout));
		});
	});
};
