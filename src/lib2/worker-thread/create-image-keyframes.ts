import { BewegungsOptions, ElementReadouts, WorkerState } from "../types";
import { checkForBorderRadius, checkForDisplayNone, highestNumber } from "../utils";
import { calculateEasingMap } from "./calculate-easings";
import {
	calculateImageKeyframes,
	getPlaceholderStyle,
	getWrapperKeyframes,
	getWrapperStyle,
	initialImageState,
} from "./calculate-image-keyframes";

const getImageOverride = (elementReadouts: ElementReadouts[]) => {
	const override: Partial<CSSStyleDeclaration> = {};
	if (elementReadouts.some(checkForBorderRadius)) {
		override.borderRadius = "0px";
	}

	return override;
};

export const getImageKeyframes = (
	elementReadouts: ElementReadouts[],
	elementString: string,
	workerState: WorkerState
) => {
	const { root, affectedBy, ratio, options, readouts, totalRuntime, changeTimings } = workerState;
	const imageState = initialImageState();
	const easings = new Set<BewegungsOptions>(
		affectedBy.get(elementString)!.flatMap((elementString) => options.get(elementString)!)
	);
	const rootReadout = readouts.get(root.get(elementString)!)!;

	imageState.ratio = ratio.get(elementString)!;
	imageState.easingTable = calculateEasingMap([...easings], totalRuntime);
	imageState.maxHeight = highestNumber(elementReadouts.map((prop) => prop.currentHeight));
	imageState.maxWidth = highestNumber(elementReadouts.map((prop) => prop.currentWidth));
	imageState.placeholderStyle = getPlaceholderStyle(elementReadouts);
	imageState.wrapperStyle = getWrapperStyle(elementReadouts, rootReadout, imageState);
	imageState.wrapperKeyframes = getWrapperKeyframes(
		elementReadouts,
		rootReadout,
		imageState,
		changeTimings
	);
	imageState.keyframes = calculateImageKeyframes(elementReadouts, imageState);
	imageState.override = getImageOverride(elementReadouts);

	return imageState;
};
