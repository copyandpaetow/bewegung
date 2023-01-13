import {
	BewegungsOptions,
	CustomKeyframe,
	DefaultKeyframes,
	ElementReadouts,
	WorkerState,
} from "../types";
import { checkForBorderRadius, checkForDisplayInline, checkForDisplayNone } from "../shared/utils";
import {
	calculateDefaultKeyframes,
	getCalcualtionsFromReadouts,
} from "./calculate-default-keyframes";
import { calculateKeyframeTables } from "./calculate-style-tables";

const checkDefaultReadouts = (
	elementReadouts: ElementReadouts[],
	parentReadouts: ElementReadouts[] | undefined,
	context: {
		isRoot: boolean;
		isText: boolean;
	}
) => {
	const override: CustomKeyframe = {};

	if (context.isRoot && elementReadouts.at(-1)!.position === "static") {
		override.position = "relative";
	}

	if (elementReadouts.some(checkForBorderRadius)) {
		override.borderRadius = "0px";
	}

	if (elementReadouts.some(checkForDisplayInline) && !context.isText) {
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
	const {
		parent,
		root,
		type,
		affectedBy,
		readouts,
		options,
		totalRuntime,
		appliableKeyframes,
		changeTimings,
	} = workerState;
	const resultingStyleChange = appliableKeyframes.at(-1)!;

	const easings = new Set<BewegungsOptions>(
		affectedBy.get(elementString)!.flatMap((elementString) => options.get(elementString) ?? [])
	);

	const styleTables = calculateKeyframeTables(elementReadouts, [...easings], totalRuntime);
	const parentReadouts = readouts.get(parent.get(elementString)!);
	const currentType = type.get(elementString)!;

	const differences = getCalcualtionsFromReadouts(
		elementReadouts,
		parentReadouts,
		currentType,
		changeTimings
	);

	const context = {
		isRoot: root.get(elementString)! === elementString,
		isText: currentType === "text",
	};

	return {
		keyframes: calculateDefaultKeyframes(differences, styleTables),
		resultingStyle: resultingStyleChange.get(elementString)!,
		override: checkDefaultReadouts(elementReadouts, parentReadouts, context),
	};
};
