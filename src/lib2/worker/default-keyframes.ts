import { DefaultKeyframes, ElementReadouts, WorkerState } from "../types";
import { checkForBorderRadius, checkForDisplayInline, checkForDisplayNone } from "../utils";
import { calculateDefaultKeyframes, getCalcualtionsFromReadouts } from "./default-calculations";
import { calculateKeyframeTables } from "./style-tables";

const checkDefaultReadouts = (elementReadouts: ElementReadouts[]) => {
	const before: Partial<CSSStyleDeclaration> = {};
	const after: Partial<CSSStyleDeclaration> = {};

	if (elementReadouts.some(checkForBorderRadius)) {
		before.borderRadius = "0px";
		after.borderRadius = elementReadouts.at(-1)!.computedStyle.borderRadius;
	}

	if (elementReadouts.some(checkForDisplayInline)) {
		before.display = "inline";
		after.display = elementReadouts.at(-1)!.computedStyle.display;
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

export const getDefaultKeyframes = (
	elementReadouts: ElementReadouts[],
	elementString: string,
	workerState: WorkerState
): DefaultKeyframes => {
	const { lookup, readouts, options, totalRuntime } = workerState;
	const entry = lookup.get(elementString)!;

	const easings = entry.chunks.map((chunkID) => options.get(chunkID)!);
	const styleTables = calculateKeyframeTables(elementReadouts, easings, totalRuntime);

	const differences = getCalcualtionsFromReadouts(
		elementReadouts,
		readouts.get(entry.parent)!,
		entry.type
	);

	return {
		keyframes: calculateDefaultKeyframes(differences, styleTables),
		overrides: checkDefaultReadouts(elementReadouts),
	};
};
