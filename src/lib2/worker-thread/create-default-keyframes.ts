import {
	BewegungsOptions,
	CustomKeyframe,
	DefaultKeyframes,
	ElementEntry,
	ElementReadouts,
	WorkerState,
} from "../types";
import { checkForBorderRadius, checkForDisplayInline, checkForDisplayNone } from "../utils";
import {
	calculateDefaultKeyframes,
	getCalcualtionsFromReadouts,
} from "./calculate-default-keyframes";
import { calculateKeyframeTables } from "./calculate-style-tables";

//TODO: if nothing happens here, these should not return anything
const checkDefaultReadouts = (
	elementReadouts: ElementReadouts[],
	parentReadouts: ElementReadouts[] | undefined,
	entry: ElementEntry,
	resultingStyleChange?: CustomKeyframe
) => {
	const before = resultingStyleChange ?? {};
	const after: CustomKeyframe = {};

	if (elementReadouts.some(checkForBorderRadius)) {
		before.borderRadius = "0px";
		after.borderRadius = elementReadouts.at(-1)!.borderRadius;
	}

	if (elementReadouts.some(checkForDisplayInline) && entry.type !== "text") {
		before.display = "inline-block";
		after.display = elementReadouts.at(-1)!.display;
	}

	if (checkForDisplayNone(elementReadouts.at(-1)!)) {
		after.display = before.display ?? "";
		after.position = before.position ?? "";
		after.width = before.width ?? "";
		after.height = before.height ?? "";
		after.left = before.left ?? "";
		after.top = before.top ?? "";
		after.gridArea = before.gridArea ?? "";

		before.display = "";
		before.position = "absolute";
		before.width = elementReadouts.at(-1)!.currentWidth + "px";
		before.height = elementReadouts.at(-1)!.currentHeight + "px";
		before.left =
			elementReadouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px";
		before.top =
			elementReadouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px";
		before.gridArea = "1/1/2/2";
	}

	return {
		before,
		after,
	};
};

export const getDefaultKeyframes = (
	elementReadouts: ElementReadouts[],
	elementString: string,
	workerState: WorkerState
): DefaultKeyframes => {
	const { lookup, readouts, options, totalRuntime, resultingStyleChange, changeTimings } =
		workerState;
	const entry = lookup.get(elementString)!;

	const easings = new Set<BewegungsOptions>(
		entry.affectedBy.flatMap((elementString) => options.get(elementString)!)
	);

	const styleTables = calculateKeyframeTables(elementReadouts, [...easings], totalRuntime);
	const parentReadouts = readouts.get(entry.parent);

	const differences = getCalcualtionsFromReadouts(
		elementReadouts,
		parentReadouts,
		entry.type,
		changeTimings
	);

	return {
		keyframes: calculateDefaultKeyframes(differences, styleTables),
		overrides: checkDefaultReadouts(
			elementReadouts,
			parentReadouts,
			entry,
			resultingStyleChange.get(elementString)
		),
	};
};
