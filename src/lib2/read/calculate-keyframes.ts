import { scheduleCallback } from "../scheduler";
import { Calculations, DimensionalDifferences, ElementReadouts, Readouts } from "../types";

const calcualtionsFromReadouts = (
	readout: Record<number, ElementReadouts>
): Record<number, DimensionalDifferences> => {
	return Object.fromEntries(
		Object.entries(readout).map((entry, index, array) => {
			const [offset, readout] = entry;
			const [_, lastReadout] = array.at(-1)!;

			//? how to geht the parent readouts in here?
		})
	);
};

export const fillCalculations = (calculations: Calculations, readouts: Readouts) => {
	scheduleCallback(() => {
		readouts.primary.forEach((row) => {
			calculations.primary.push(row.map((entry) => calcualtionsFromReadouts(entry)));
		});
	});
	scheduleCallback(() => {
		readouts.secondary.forEach((row) => {
			calculations.secondary.push(row.map((entry) => calcualtionsFromReadouts(entry)));
		});
	});
};
