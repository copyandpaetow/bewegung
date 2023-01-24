import { filterMatchingStyleFromKeyframes } from "../main-thread/apply-styles";
import { CssRuleName, CustomKeyframe } from "../types";

export const updateChangeTimings = (changeTimings: Set<number>, keyframes: CustomKeyframe[]) => {
	keyframes.forEach(({ offset }) => {
		changeTimings.add(offset ?? 1);
	});
};

export const updateChangeProperties = (
	changeProperties: Set<CssRuleName>,
	keyframes: CustomKeyframe[]
) => {
	keyframes.forEach(({ offset, ...stylings }) => {
		Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
	});
};

export const calculateAppliableKeyframes = (
	keyframes: Map<string, CustomKeyframe[]>,
	changeTimings: number[]
) => {
	const appliableKeyframes = new Map<number, Map<string, CustomKeyframe>>();

	changeTimings.forEach((timing) => {
		const resultingStyle = new Map<string, CustomKeyframe>();
		keyframes.forEach((keyframe, elementString) => {
			const combinedKeyframe = filterMatchingStyleFromKeyframes(keyframe, timing);

			if (!combinedKeyframe) {
				return;
			}
			resultingStyle.set(elementString, combinedKeyframe);
		});
		appliableKeyframes.set(timing, resultingStyle);
	});

	return appliableKeyframes;
};
