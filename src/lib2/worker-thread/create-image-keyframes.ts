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
	const { lookup, options, readouts, totalRuntime, changeTimings } = workerState;
	const imageState = initialImageState();

	const entry = lookup.get(elementString)!;

	const easings = new Set<BewegungsOptions>(
		entry.affectedBy.flatMap((elementString) => options.get(elementString)!)
	);
	const rootReadout = readouts.get(entry.root)!;

	imageState.ratio = entry.ratio;
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
