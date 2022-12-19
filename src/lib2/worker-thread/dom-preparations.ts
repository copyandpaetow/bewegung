import { defaultChangeProperties } from "../constants";
import { filterMatchingStyleFromKeyframes } from "../main-thread/apply-styles";
import { CssRuleName, CustomKeyframe, StyleChangePossibilities, WorkerState } from "../types";

export const calculateChangeTimings = (allKeyframes: CustomKeyframe[][]) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset }) => {
			newTimings.add(offset ?? 1);
		});
	});

	return Array.from(newTimings).sort((a, b) => a - b);
};

export const calculateChangeProperties = (allKeyframes: CustomKeyframe[][]) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset, easing, composite, ...stylings }) => {
			Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
		});
	});

	return Array.from(changeProperties);
};

export const calculateAppliableKeyframes = (workerState: WorkerState) => {
	const { keyframes, changeTimings } = workerState;
	const appliableKeyframes: Map<string, CustomKeyframe>[] = [];

	changeTimings.forEach((timing) => {
		const resultingStyle = new Map<string, CustomKeyframe>();
		keyframes.forEach((keyframe, elementString) => {
			const combinedKeyframe = filterMatchingStyleFromKeyframes(keyframe, timing);

			if (!combinedKeyframe) {
				return;
			}
			resultingStyle.set(elementString, combinedKeyframe);
		});
		appliableKeyframes.push(resultingStyle);
	});

	return appliableKeyframes;
};
