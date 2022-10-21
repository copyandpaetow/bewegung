import { defaultChangeProperties } from "../constants";
import {
	AnimationState,
	CssRuleName,
	CustomKeyframe,
	DimensionalDifferences,
	ElementReadouts,
	MainKeyframe,
	Overrides,
	State,
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

export const setReadouts = (animationState: AnimationState, state: State) => {
	const { readouts, imageReadouts } = animationState;
	const { mainElements, secondaryElements, keyframes, cssStyleReset } = state;

	const allKeyframes = Array.from(mainElements).flatMap((element) => keyframes.get(element)!);
	const changeTimings = calculateChangeTimings(allKeyframes);
	const changeProperties = calculateChangeProperties(allKeyframes);

	changeTimings.forEach((timing) => {
		mainElements.forEach((element) => {
			keyframes.get(element)!.forEach((keyframe) => {
				applyCSSStyles(element, filterMatchingStyleFromKeyframes(keyframe, timing));
			});
		});
		[...mainElements, ...secondaryElements].forEach((element) => {
			const calculation = getCalculations(element, timing, changeProperties);
			const allCalculation = readouts.get(element)?.concat(calculation) ?? [calculation];

			(element.tagName === "IMG" ? imageReadouts : readouts).set(element, allCalculation);
		});

		mainElements.forEach((element) => restoreOriginalStyle(element, cssStyleReset.get(element)!));
	});
};

export const initialAnimationState = (): AnimationState => ({
	readouts: new Map<HTMLElement, ElementReadouts[]>(),
	imageReadouts: new Map<HTMLElement, ElementReadouts[]>(),
	overrides: new Map<HTMLElement, Overrides[]>(),
});
