import { scheduleCallback } from "../scheduler";
import { DifferenceArray, DimensionalDifferences, ElementReadouts } from "../types";
import { calculateDimensionDifferences } from "./calculate-dimension-differences";

const checkForTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (childNodes.length === 0) {
		return false;
	}

	return childNodes.every((node) => Boolean(node.textContent?.trim()));
};

const calcualtionsFromReadouts = (
	readouts: ElementReadouts[],
	parentReadouts: ElementReadouts[],
	isTextNode: boolean
): DimensionalDifferences[] => {
	return readouts.map((readout, index, array) => {
		const child: DifferenceArray = [readout, array.at(-1)!];
		const parent: DifferenceArray = [parentReadouts[index], parentReadouts.at(-1)!];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const fillCalculations = (
	calculations: Map<HTMLElement, DimensionalDifferences[]>,
	allReadouts: Map<HTMLElement, ElementReadouts[]>
) => {
	allReadouts.forEach((readouts, element) => {
		scheduleCallback(() => {
			const parentReadouts = allReadouts.get(element.parentElement!) ?? readouts;
			calculations.set(
				element,
				calcualtionsFromReadouts(readouts, parentReadouts, checkForTextNode(element))
			);
		});
	});
};
