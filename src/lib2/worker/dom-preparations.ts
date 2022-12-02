import { filterMatchingStyleFromKeyframes } from "../apply-styles";
import { defaultChangeProperties } from "../constants";
import { CssRuleName, CustomKeyframe, StyleChangePossibilities, WorkerState } from "../types";

export const calculateChangeTimings = (allKeyframes: Map<string, CustomKeyframe[]>) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset }) => {
			newTimings.add(offset ?? 1);
		});
	});

	return Array.from(newTimings).sort((a, b) => a - b);
};

export const calculateChangeProperties = (allKeyframes: Map<string, CustomKeyframe[]>) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset, ...stylings }) => {
			Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
		});
	});

	return Array.from(changeProperties);
};

export const calculateAppliableKeyframes = (workerState: WorkerState) => {
	const { elements, keyframes, changeTimings } = workerState;
	const appliableKeyframes: Map<string, StyleChangePossibilities>[] = [];

	changeTimings.forEach((timing) => {
		const resultingStyle = new Map<string, StyleChangePossibilities>();
		keyframes.forEach((keyframe, chunkID) => {
			//TODO: if nothing was added they should not be added to the resulting style
			const combinedKeyframe = filterMatchingStyleFromKeyframes(keyframe, timing);
			elements.get(chunkID)!.forEach((mainElement) => {
				resultingStyle.set(mainElement, combinedKeyframe);
			});
		});
		appliableKeyframes.push(resultingStyle);
	});
	return appliableKeyframes;
};
