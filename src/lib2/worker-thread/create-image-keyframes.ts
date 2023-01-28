import { defaultImageStyles } from "../shared/constants";
import { checkForBorderRadius, highestNumber } from "../shared/utils";
import { BewegungsOptions, CustomKeyframe, ImageData, ResultState } from "../types";
import { calculateEasingMap } from "./calculate-easings";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	getWrapperStyle,
} from "./calculate-image-keyframes";

const setImageOverride = (resultState: ResultState) => {
	const { imageReadouts, overrides } = resultState;
	imageReadouts.forEach((elementReadouts, elementString) => {
		overrides.set(elementString, {
			...(overrides.get(elementString) ?? {}),
			...defaultImageStyles,
		});

		if (elementReadouts.some(checkForBorderRadius)) {
			overrides.set(elementString, {
				...(overrides.get(elementString) ?? {}),
				borderRadius: "0px",
			});
		}
	});
};

const setImageData = (resultState: ResultState) => {
	const { ratio, totalRuntime, affectedBy, options, imageReadouts } = resultState;
	const imageDataMap = new Map<string, ImageData>();

	imageReadouts.forEach((elementReadouts, elementString) => {
		const easings = new Set<BewegungsOptions>(
			affectedBy.get(elementString)!.flatMap((elementString) => options.get(elementString) ?? [])
		);

		imageDataMap.set(elementString, {
			ratio: ratio.get(elementString)!,
			maxHeight: highestNumber(elementReadouts.map((prop) => prop.currentHeight)),
			maxWidth: highestNumber(elementReadouts.map((prop) => prop.currentWidth)),
			easingTable: calculateEasingMap([...easings], totalRuntime),
		});
	});

	return imageDataMap;
};

export const getImageKeyframes = (resultState: ResultState) => {
	const {
		root,
		changeTimings,
		imageReadouts,
		defaultReadouts,
		resultingStyle,
		keyframes,
		wrappers,
		placeholders,
	} = resultState;
	const imageDataMap = setImageData(resultState);

	imageReadouts.forEach((elementReadouts, elementString) => {
		const imageData = imageDataMap.get(elementString)!;
		const rootReadout = defaultReadouts.get(root.get(elementString)!)!;
		const placeholder = `${elementString}-placeholder`;
		const wrapper = `${elementString}-wrapper`;

		resultingStyle.set(placeholder, {
			height: elementReadouts.at(-1)!.unsaveHeight + "px",
			width: elementReadouts.at(-1)!.unsaveWidth + "px",
		});

		resultingStyle.set(wrapper, getWrapperStyle(elementReadouts, rootReadout, imageData));

		resultingStyle.set(elementString, {
			...(resultingStyle.get(elementString) ?? {}),
		});

		keyframes.set(
			wrapper,
			getWrapperKeyframes(elementReadouts, rootReadout, imageData, changeTimings)
		);

		keyframes.set(elementString, calculateImageKeyframes(elementReadouts, imageData));

		wrappers.set(elementString, wrapper);
		placeholders.set(elementString, placeholder);
	});
	setImageOverride(resultState);
};
