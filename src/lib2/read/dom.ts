import { defaultChangeProperties } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	CalculatedElementProperties,
	Calculations,
	ComputedState,
	CssRuleName,
	CustomKeyframe,
	MainKeyframe,
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
//* this could be used to filter the elements, but it could lead to bugs because everything is tied to the index and they would be off
//* unless everything is filtered with this (mainElements, secondaryELement, calculations, resets)
const getRelevantIndices = (keyframes: MainKeyframe, timing: number) =>
	keyframes.reduce((indexAccumulator, currentkeyframes, index) => {
		if (timing === 0 || currentkeyframes.some((frame) => frame.offset === timing)) {
			indexAccumulator.push(index);
		}

		return indexAccumulator;
	}, [] as number[]);

export const fillCalculations = (
	calculations: Calculations,
	state: StructureOfChunks,
	computedState: ComputedState
) => {
	const changeTimings = calculateChangeTimings(state.keyframes);
	const changeProperties = calculateChangeProperties(state.keyframes);

	changeTimings.forEach((timing) => {
		scheduleCallback(() => {
			const calculationMap = new WeakMap<HTMLElement, CalculatedElementProperties>();
			const relevantIndices = getRelevantIndices(state.keyframes, timing);

			state.elements.forEach((row, index) => {
				if (!relevantIndices.includes(index)) {
					return;
				}

				row.forEach((mainElement) => {
					applyCSSStyles(
						mainElement,
						filterMatchingStyleFromKeyframes(state.keyframes[index], timing)
					);
				});
			});

			state.elements.forEach((row, index) => {
				if (!relevantIndices.includes(index)) {
					return;
				}
				row.concat(computedState.secondaryElements[index]).forEach((element) => {
					if (calculationMap.has(element)) {
						return;
					}
					calculationMap.set(element, getCalculations(element, timing, changeProperties));
				});
			});

			state.elements.forEach((row, rowIndex) => {
				if (!relevantIndices.includes(rowIndex)) {
					return;
				}
				row.forEach((mainElement, index) => {
					((calculations.primary[rowIndex] ??= [])[index] ??= {})[timing] =
						calculationMap.get(mainElement)!;
				});
			});

			computedState.secondaryElements.forEach((row, rowIndex) => {
				if (!relevantIndices.includes(rowIndex)) {
					return;
				}
				row.forEach((secondaryElement, index) => {
					((calculations.secondary[rowIndex] ??= [])[index] ??= {})[timing] =
						calculationMap.get(secondaryElement)!;
				});
			});

			state.elements.forEach((row, rowIndex) => {
				if (!relevantIndices.includes(rowIndex)) {
					return;
				}
				row.forEach((mainElement, index) => {
					restoreOriginalStyle(mainElement, computedState.cssStyleReset[rowIndex][index]);
				});
			});
		});
	});
};
