import { defaultChangeProperties } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	CalculatedElementProperties,
	Calculations,
	ComputedState,
	CssRuleName,
	CustomKeyframe,
	StructureOfChunks,
} from "../types";
import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
	restoreOriginalStyle,
} from "./apply-styles";
import { getCalculations } from "./calculate-dom-properties";

const calculateChangeTimings = (allKeyframes: CustomKeyframe[][]) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset }) => {
			newTimings.add(offset ?? 1);
		});
	});
	return Array.from(newTimings).sort((a, b) => a - b);
};

const calculateChangeProperties = (allKeyframes: CustomKeyframe[][]) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset, ...stylings }) => {
			Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
		});
	});
	return Array.from(changeProperties);
};

//TODO: filter elements
export const fillCalculations = (
	calculations: Calculations,
	state: StructureOfChunks,
	computedState: ComputedState
) => {
	const changeTimings = calculateChangeTimings(state.keyframes);
	const changeProperties = calculateChangeProperties(state.keyframes);

	changeTimings.forEach((timing) => {
		scheduleCallback(() => {
			state.elements.forEach((row, index) => {
				row.forEach((mainElement) => {
					applyCSSStyles(
						mainElement,
						filterMatchingStyleFromKeyframes(state.keyframes[index], timing)
					);
				});
			});

			const calculationMap = new WeakMap<HTMLElement, CalculatedElementProperties>();

			state.elements
				.concat(computedState.secondaryElements)
				.flat()
				.forEach((mainElement) => {
					if (calculationMap.has(mainElement)) {
						return;
					}
					calculationMap.set(mainElement, getCalculations(mainElement, timing, changeProperties));
				});

			state.elements.forEach((row, rowIndex) => {
				if (!calculations.primary[rowIndex]) {
					calculations.primary[rowIndex] = [];
				}
				row.forEach((mainElement, index) => {
					if (!calculations.primary[rowIndex][index]) {
						calculations.primary[rowIndex][index] = {};
					}
					calculations.primary[rowIndex][index][timing] = calculationMap.get(mainElement)!;
				});
			});

			computedState.secondaryElements.forEach((row, rowIndex) => {
				if (!calculations.secondary[rowIndex]) {
					calculations.secondary[rowIndex] = [];
				}
				row.forEach((secondaryElement, index) => {
					if (!calculations.secondary[rowIndex][index]) {
						calculations.secondary[rowIndex][index] = {};
					}
					calculations.secondary[rowIndex][index][timing] = calculationMap.get(secondaryElement)!;
				});
			});

			state.elements.forEach((row, rowIndex) => {
				row.forEach((mainElement, index) => {
					restoreOriginalStyle(mainElement, computedState.cssStyleReset[rowIndex][index]);
				});
			});
		});
	});
};
