import { defaultChangeProperties } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	AnimationState,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
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
		scheduleCallback(() => {
			mainElements.forEach((element) => {
				keyframes.get(element)?.forEach((keyframe) => {
					//TODO: this can be calculated beforehand to reduce calculation time here
					applyCSSStyles(element, filterMatchingStyleFromKeyframes(keyframe, timing));
				});
			});
			//TODO: This copying doesnt need to happen every round, should be done before
			[...mainElements, ...secondaryElements].forEach((element) => {
				const calculation = getCalculations(element, timing, changeProperties);

				//TODO: The elements dont need to be treated like this if the image doesnt change in scale (and is just moved around)
				const currentReadout = element.tagName === "IMG" ? imageReadouts : readouts;
				const existingCalculations = currentReadout.get(element)?.concat(calculation) ?? [
					calculation,
				];
				currentReadout.set(element as HTMLImageElement, existingCalculations);
			});

			mainElements.forEach((element) => restoreOriginalStyle(element, cssStyleReset.get(element)!));
		});
	});
};

export const initialAnimationState = (): AnimationState => ({
	readouts: new Map<HTMLElement, ElementReadouts[]>(),
	imageReadouts: new Map<HTMLImageElement, ElementReadouts[]>(),
});
