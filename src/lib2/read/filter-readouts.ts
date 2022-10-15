import { scheduleCallback } from "../scheduler";
import { ElementReadouts } from "../types";

const areEntriesDifferent = (previous: ElementReadouts, current: ElementReadouts): boolean => {
	if (
		Object.entries(previous.dimensions).some(
			([property, value]) => current.dimensions[property] !== value
		)
	) {
		return true;
	}
	if (
		Object.entries(previous.computedStyle).some(
			([property, value]) => current.computedStyle[property] !== value
		)
	) {
		return true;
	}

	return false;
};

export const filterReadouts = (
	allReadouts: Map<HTMLElement, ElementReadouts[]>,
	deleteCallback: (element: HTMLElement) => void
) => {
	allReadouts.forEach((readouts, element) => {
		scheduleCallback(() => {
			const filteredReadouts = readouts.reduce(
				(accumulator: ElementReadouts[], current: ElementReadouts) => {
					if (accumulator.length === 0 || areEntriesDifferent(accumulator.at(-1)!, current)) {
						accumulator.push(current);
					}

					return accumulator;
				},
				[]
			);

			//! filtering keyframe will lead to uneven keyframes for the parent and this element
			if (filteredReadouts.length > 1) {
				allReadouts.set(element, filteredReadouts);
				return;
			}

			//! deleting keyframes might create a situation where the parents parent (or their parent) might be different
			allReadouts.delete(element);
			deleteCallback(element);
		});
	});
};
