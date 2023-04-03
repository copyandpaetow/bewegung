import { ElementReadouts, WorkerState } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateImageKeyframes = (
	imageReadouts: Map<string, ElementReadouts[]>,
	state: WorkerState
) => {
	const { dimensions, easings, parents } = state;

	imageReadouts.forEach((readouts, elementID) => {
		const easing = easings.get(elementID)!;
		const parentReadouts = dimensions.get(parents.get(elementID)!)!;
		const placeholder = `${elementID}-placeholder`;
		const wrapper = `${elementID}-wrapper`;
		const maxHeight = highestNumber(readouts.map((entry) => entry.height));
		const maxWidth = highestNumber(readouts.map((entry) => entry.width));
	});
};
