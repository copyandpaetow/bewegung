import { defaultImageStyles } from "../shared/constants";
import { checkForBorderRadius, highestNumber } from "../shared/utils";
import { ImageData, ResultState } from "../types";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	getWrapperStyle,
} from "./calculate-image-keyframes";

const setImageOverride = (resultState: ResultState) => {
	const { imageReadouts, overrides } = resultState;
	imageReadouts.forEach((elementReadouts, elementID) => {
		overrides.set(elementID, {
			...(overrides.get(elementID) ?? {}),
			...defaultImageStyles,
		});

		if (elementReadouts.some(checkForBorderRadius)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				borderRadius: "0px",
			});
		}
	});
};

const setImageData = (resultState: ResultState) => {
	const { ratio, imageReadouts, easings } = resultState;
	const imageDataMap = new Map<string, ImageData>();

	imageReadouts.forEach((elementReadouts, elementID) => {
		imageDataMap.set(elementID, {
			ratio: ratio.get(elementID)!,
			maxHeight: highestNumber(elementReadouts.map((entry) => entry.currentHeight)),
			maxWidth: highestNumber(elementReadouts.map((entry) => entry.currentWidth)),
			easingTable: easings.get(elementID)!,
		});
	});

	return imageDataMap;
};

export const getImageKeyframes = (resultState: ResultState) => {
	const {
		parent,
		imageReadouts,
		defaultReadouts,
		resultingStyle,
		keyframes,
		wrappers,
		placeholders,
		easings,
	} = resultState;
	const imageDataMap = setImageData(resultState);

	imageReadouts.forEach((elementReadouts, elementID) => {
		const imageData = imageDataMap.get(elementID)!;
		const parentID = parent.get(elementID)!;
		const parentReadout = defaultReadouts.get(parentID)!;
		//const parentEasing = easings.get(parentID)!;
		const placeholder = `${elementID}-placeholder`;
		const wrapper = `${elementID}-wrapper`;

		resultingStyle.set(placeholder, {
			height: elementReadouts.at(-1)!.unsaveHeight + "px",
			width: elementReadouts.at(-1)!.unsaveWidth + "px",
		});
		resultingStyle.set(wrapper, getWrapperStyle(elementReadouts, parentReadout, imageData));
		resultingStyle.set(elementID, {
			...(resultingStyle.get(elementID) ?? {}),
		});

		keyframes.set(wrapper, getWrapperKeyframes(elementReadouts, parentReadout, imageData));
		keyframes.set(elementID, calculateImageKeyframes(elementReadouts, imageData));

		wrappers.set(elementID, wrapper);
		placeholders.set(elementID, placeholder);
	});
	setImageOverride(resultState);
};
