import { defaultChangeProperties } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	ComputedState,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
	MainKeyframe,
	Readouts,
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

const getRelevantIndices = (keyframes: MainKeyframe, timing: number) =>
	keyframes.reduce((indexAccumulator, currentkeyframes, index) => {
		if (timing === 0 || currentkeyframes.some((frame) => frame.offset === timing)) {
			indexAccumulator.push(index);
		}

		return indexAccumulator;
	}, [] as number[]);

export const fillReadouts = (
	readouts: Readouts,
	state: StructureOfChunks,
	computedState: ComputedState
) => {
	const changeTimings = calculateChangeTimings(state.keyframes);
	const changeProperties = calculateChangeProperties(state.keyframes);

	changeTimings.forEach((timing) => {
		scheduleCallback(() => {
			const readoutMap = new WeakMap<HTMLElement, ElementReadouts>();
			const relevantIndices = getRelevantIndices(state.keyframes, timing);

			const tasks: ((row: HTMLElement[], rowIndex: number) => void)[] = [
				(row, rowIndex) =>
					row.forEach((mainElement) => {
						applyCSSStyles(
							mainElement,
							filterMatchingStyleFromKeyframes(state.keyframes[rowIndex], timing)
						);
					}),
				(row, rowIndex) =>
					row.concat(computedState.secondaryElements[rowIndex]).forEach((element) => {
						if (readoutMap.has(element)) {
							return;
						}
						readoutMap.set(element, getCalculations(element, timing, changeProperties));
					}),
				(row, rowIndex) =>
					row.forEach((mainElement, index) => {
						((readouts.primary[rowIndex] ??= [])[index] ??= {})[timing] =
							readoutMap.get(mainElement)!;
					}),
				(_, rowIndex) =>
					computedState.secondaryElements[rowIndex].forEach((secondaryElement, index) => {
						((readouts.secondary[rowIndex] ??= [])[index] ??= {})[timing] =
							readoutMap.get(secondaryElement)!;
					}),
				(row, rowIndex) =>
					row.forEach((mainElement, index) => {
						restoreOriginalStyle(mainElement, computedState.cssStyleReset[rowIndex][index]);
					}),
			];

			tasks.forEach((task) => {
				state.elements.forEach((row, rowIndex) => {
					if (!relevantIndices.includes(rowIndex)) {
						return;
					}
					task(row, rowIndex);
				});
			});
		});
	});
};
