import { defaultImageStyles } from "../shared/constants";
import { checkForBorderRadius, highestNumber } from "../shared/utils";
import { BewegungsOptions, ImageData, ResultState } from "../types";
import { calculateEasingMap } from "./calculate-easings";
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
	const { ratio, totalRuntime, affectedBy, options, imageReadouts } = resultState;
	const imageDataMap = new Map<string, ImageData>();

	imageReadouts.forEach((elementReadouts, elementID) => {
		const easings = new Set<BewegungsOptions>(
			affectedBy.get(elementID)!.flatMap((elementID) => options.get(elementID) ?? [])
		);

		imageDataMap.set(elementID, {
			ratio: ratio.get(elementID)!,
			maxHeight: highestNumber(elementReadouts.map((entry) => entry.currentHeight)),
			maxWidth: highestNumber(elementReadouts.map((entry) => entry.currentWidth)),
			easingTable: calculateEasingMap([...easings], totalRuntime),
		});
	});

	return imageDataMap;
};

export const getImageKeyframes = (resultState: ResultState) => {
	const {
		root,
		imageReadouts,
		defaultReadouts,
		resultingStyle,
		keyframes,
		wrappers,
		placeholders,
	} = resultState;
	const imageDataMap = setImageData(resultState);

	imageReadouts.forEach((elementReadouts, elementID) => {
		const imageData = imageDataMap.get(elementID)!;
		const rootReadout = defaultReadouts.get(root.get(elementID)!)!;
		const placeholder = `${elementID}-placeholder`;
		const wrapper = `${elementID}-wrapper`;

		resultingStyle.set(placeholder, {
			height: elementReadouts.at(-1)!.unsaveHeight + "px",
			width: elementReadouts.at(-1)!.unsaveWidth + "px",
		});
		resultingStyle.set(wrapper, getWrapperStyle(elementReadouts, rootReadout, imageData));
		resultingStyle.set(elementID, {
			...(resultingStyle.get(elementID) ?? {}),
		});

		keyframes.set(wrapper, getWrapperKeyframes(elementReadouts, rootReadout, imageData));
		keyframes.set(elementID, calculateImageKeyframes(elementReadouts, imageData));

		wrappers.set(elementID, wrapper);
		placeholders.set(elementID, placeholder);
	});
	setImageOverride(resultState);
};
