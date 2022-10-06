import { scheduleCallback } from "../scheduler";
import { ElementReadouts, Calculations, Readouts } from "../types";

export const isEntryVisible = (entry: ElementReadouts) =>
	entry.computedStyle.display !== "none" &&
	entry.dimensions.height !== 0 &&
	entry.dimensions.width !== 0;

export const recalculateDisplayNoneValues = (calculation: Record<number, ElementReadouts>) => {
	const keys = Object.keys(calculation);
	const isVisible = (key: string) => isEntryVisible(calculation[key]);

	if (keys.every(isVisible)) {
		return;
	}

	keys.forEach((key, index, array) => {
		if (isEntryVisible(calculation[key])) {
			return;
		}
		const nextEntryKey = (array.slice(0, index).reverse().find(isVisible) ||
			array.slice(index).find(isVisible))!;

		if (nextEntryKey === "undefined") {
			throw new Error("a valid key must be present since one was found earlier");
		}

		calculation[key].dimensions = { ...calculation[nextEntryKey].dimensions, width: 0, height: 0 };
	});
};

export const adjustForDisplayNone = (allReadouts: Readouts) => {
	scheduleCallback(() => {
		allReadouts.primary.forEach((row) => {
			row.forEach(recalculateDisplayNoneValues);
		});
	});
	scheduleCallback(() => {
		allReadouts.secondary.forEach((row) => {
			row.forEach(recalculateDisplayNoneValues);
		});
	});
};
