import { BewegungsOptions, ElementReadouts, WorkerState } from "../types";
import { checkForBorderRadius, checkForDisplayNone, highestNumber } from "../utils";
import { calculateEasingMap } from "./easings";
import {
	calculateImageKeyframes,
	getPlaceholderStyle,
	getWrapperKeyframes,
	getWrapperStyle,
	initialImageState,
} from "./image-calculations";

const getImageOverride = (elementReadouts: ElementReadouts[]) => {
	const before: Partial<CSSStyleDeclaration> = {};
	const after: Partial<CSSStyleDeclaration> = {};

	if (elementReadouts.some(checkForBorderRadius)) {
		before.borderRadius = "0px";
		after.borderRadius = elementReadouts.at(-1)!.computedStyle.borderRadius;
	}

	if (elementReadouts.some(checkForDisplayNone)) {
		before.display = before.display ?? "block";
		before.position = "absolute";
		after.display = elementReadouts.at(-1)!.computedStyle.display;
	}

	return {
		before,
		after,
	};
};

export const getImageKeyframes = (
	elementReadouts: ElementReadouts[],
	elementString: string,
	workerState: WorkerState
) => {
	const { lookup, options, readouts, totalRuntime } = workerState;
	const imageState = initialImageState();

	const entry = lookup.get(elementString)!;

	const easings = new Set<BewegungsOptions>(
		entry.affectedBy.flatMap((elementString) => options.get(elementString)!)
	);

	imageState.ratio = entry.ratio;
	imageState.easingTable = calculateEasingMap([...easings], totalRuntime);
	imageState.maxHeight = highestNumber(elementReadouts.map((prop) => prop.dimensions.height));
	imageState.maxWidth = highestNumber(elementReadouts.map((prop) => prop.dimensions.width));
	imageState.placeholderStyle = getPlaceholderStyle(elementReadouts);
	imageState.wrapperStyle = getWrapperStyle(elementReadouts, readouts.get(entry.root)!, imageState);
	imageState.wrapperKeyframes = getWrapperKeyframes(
		elementReadouts,
		readouts.get(entry.root)!,
		imageState
	);
	imageState.keyframes = calculateImageKeyframes(elementReadouts, imageState);
	imageState.overrides = getImageOverride(elementReadouts);

	return imageState;
};
