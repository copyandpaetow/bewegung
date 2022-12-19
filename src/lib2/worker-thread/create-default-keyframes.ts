import {
	BewegungsOptions,
	CustomKeyframe,
	DefaultKeyframes,
	ElementEntry,
	ElementReadouts,
	EntryType,
	StyleChangePossibilities,
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
	entry: ElementEntry,
	resultingStyleChange?: CustomKeyframe
) => {
	const before = resultingStyleChange ?? {};
	const after: CustomKeyframe = {};

	if (elementReadouts.some(checkForBorderRadius)) {
		before.borderRadius = "0px";
		after.borderRadius = elementReadouts.at(-1)!.computedStyle.borderRadius;
	}

	if (elementReadouts.some(checkForDisplayInline) && entry.type !== "text") {
		before.display = "inline-block";
		after.display = elementReadouts.at(-1)!.computedStyle.display;
	}

	if (elementReadouts.some(checkForDisplayNone)) {
		before.display = before.display ?? "block";
		after.display = elementReadouts.at(-1)!.computedStyle.display;
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

	const differences = getCalcualtionsFromReadouts(
		elementReadouts,
		readouts.get(entry.parent)!,
		entry.type,
		changeTimings
	);

	return {
		keyframes: calculateDefaultKeyframes(differences, styleTables),
		overrides: checkDefaultReadouts(
			elementReadouts,
			entry,
			resultingStyleChange.get(elementString)
		),
	};
};
