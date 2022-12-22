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

const checkDefaultReadouts = (
	elementReadouts: ElementReadouts[],
	parentReadouts: ElementReadouts[] | undefined,
	entry: ElementEntry
) => {
	const override: CustomKeyframe = {};

	if (entry.self === entry.root && elementReadouts.at(-1)!.position === "static") {
		override.position = "relative";
	}

	if (elementReadouts.some(checkForBorderRadius)) {
		override.borderRadius = "0px";
	}

	if (elementReadouts.some(checkForDisplayInline) && entry.type !== "text") {
		override.display = "inline-block";
	}

	if (checkForDisplayNone(elementReadouts.at(-1)!)) {
		override.display = "";
		override.position = "absolute";
		// override.width = elementReadouts.at(-1)!.currentWidth + "px";
		// override.height = elementReadouts.at(-1)!.currentHeight + "px";
		override.left =
			elementReadouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px";
		override.top =
			elementReadouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px";
	}

	return override;
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
		resultingStyle: resultingStyleChange.get(elementString)!,
		override: checkDefaultReadouts(elementReadouts, parentReadouts, entry),
	};
};
