import { filterMatchingStyleFromKeyframes } from "../main-thread/apply-styles";
import { defaultChangeProperties } from "../shared/constants";
import { CssRuleName, CustomKeyframe, WorkerState } from "../types";

export const updateChangeTimings = (state: WorkerState, keyframes: CustomKeyframe[]) => {
	const newTimings = new Set(state.changeTimings);

	keyframes.forEach(({ offset }) => {
		newTimings.add(offset ?? 1);
	});

	state.changeTimings = Array.from(newTimings).sort((a, b) => a - b);
};

export const updateChangeProperties = (state: WorkerState, keyframes: CustomKeyframe[]) => {
	const changeProperties = new Set(defaultChangeProperties);

	keyframes.forEach(({ offset, ...stylings }) => {
		Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
	});

	return Array.from(changeProperties);
};

export const calculateAppliableKeyframes = (
	keyframes: Map<string, CustomKeyframe[]>,
	changeTimings: number[]
) => {
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
