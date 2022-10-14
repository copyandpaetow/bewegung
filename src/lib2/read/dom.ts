import { defaultChangeProperties } from "../constants";
import { CssRuleName, CustomKeyframe, ElementReadouts, MainKeyframe } from "../types";
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

export const fillReadouts = (
	readouts: Map<HTMLElement, ElementReadouts[]>,
	elements: { main: HTMLElement[][]; secondary: HTMLElement[] },
	styles: { keyframes: MainKeyframe; resets: WeakMap<HTMLElement, Map<string, string>> }
) => {
	const changeTimings = calculateChangeTimings(styles.keyframes);
	const changeProperties = calculateChangeProperties(styles.keyframes);

	const keyframesMap = new Map<HTMLElement, CustomKeyframe[]>();

	elements.main.forEach((row, rowIndex) => {
		row.forEach((element) => {
			const relevantKeyframes =
				keyframesMap.get(element)?.concat(styles.keyframes[rowIndex]) ?? styles.keyframes[rowIndex];
			keyframesMap.set(element, relevantKeyframes);
		});
	});

	changeTimings.forEach((timing) => {
		const mainElements = elements.main.flat();

		keyframesMap.forEach((keyframes, element) =>
			applyCSSStyles(element, filterMatchingStyleFromKeyframes(keyframes, timing))
		);

		mainElements.concat(elements.secondary).forEach((element) => {
			const calculation = getCalculations(element, timing, changeProperties);
			const allCalculation = readouts.get(element)?.concat(calculation) ?? [calculation];
			readouts.set(element, allCalculation);
		});

		mainElements.forEach((element) => restoreOriginalStyle(element, styles.resets.get(element)!));
	});
};
