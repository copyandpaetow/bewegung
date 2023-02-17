import { checkForBorderRadius, checkForDisplayNone } from "../shared/utils";
import {
	BewegungsOptions,
	DifferenceArray,
	DimensionalDifferences,
	ResultState,
	StyleTables,
} from "../types";
import { calculateDefaultKeyframes } from "./calculate-default-keyframes";
import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { calculateKeyframeTables } from "./calculate-style-tables";

const getNextParent = (elementID: string, resultState: ResultState) => {
	const { parent, defaultReadouts, root } = resultState;
	const isRoot = root.get(elementID) === elementID;
	const parentID = parent.get(elementID)!;

	if (isRoot) {
		return elementID;
	}
	if (defaultReadouts.has(parentID)) {
		return parentID;
	}

	return getNextParent(parentID, resultState);
};

const setOverrides = (resultState: ResultState) => {
	const { overrides, defaultReadouts } = resultState;

	defaultReadouts.forEach((readouts, elementID) => {
		const parentKey = getNextParent(elementID, resultState);
		const parentReadouts = parentKey ? defaultReadouts.get(parentKey) : undefined;

		if (checkForDisplayNone(readouts.at(-1)!)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				display: "",
				position: "absolute",
				left: readouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px",
				top: readouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px",
				width: readouts.at(-1)!.currentWidth + "px",
				height: readouts.at(-1)!.currentHeight + "px",
			});
			if (parentKey && parentReadouts!.at(-1)!.position === "static") {
				overrides.set(parentKey, {
					...(overrides.get(parentKey) ?? {}),
					position: "relative",
				});
			}
		}

		if (readouts.some(checkForBorderRadius)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				borderRadius: "0px",
			});
		}

		// if (readouts.some(checkForDisplayInline) && type.get(elementID)! === "text") {
		// 	overrides.set(elementID, {
		// 		...(overrides.get(elementID) ?? {}),
		// 		display: "inline-block",
		// 	});
		// }
	});
};

const hasElementChanged = (entry: DimensionalDifferences) =>
	entry.heightDifference !== 1 ||
	entry.leftDifference !== 0 ||
	entry.topDifference !== 0 ||
	entry.widthDifference !== 1;

const calculateDifferences = (resultState: ResultState) => {
	const { parent, root, type, defaultReadouts } = resultState;
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	defaultReadouts.forEach((elementReadouts, elementID) => {
		const isRoot = root.get(elementID) === elementID;
		const isText = type.get(elementID) === "text";
		if (isRoot) {
			const differences = elementReadouts.map((currentReadout) => {
				const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
				return calculateDimensionDifferences(child, [undefined, undefined], isText);
			});
			differenceMap.set(elementID, differences);
			return;
		}

		const parentReadouts = defaultReadouts.get(parent.get(elementID)!)!;
		const differences = elementReadouts.map((currentReadout) => {
			const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
			const correspondingParentEntry = parentReadouts?.find(
				(entry) => entry.offset === currentReadout.offset
			)!;

			return calculateDimensionDifferences(
				child,
				[correspondingParentEntry, parentReadouts.at(-1)!],
				isText
			);
		});

		differenceMap.set(elementID, differences);
	});

	return differenceMap;
};

const filterDifferences = (
	differenceMap: Map<string, DimensionalDifferences[]>,
	resultState: ResultState
) => {
	const { defaultReadouts, root } = resultState;

	differenceMap.forEach((differences, elementID) => {
		if (differences.some(hasElementChanged) || root.get(elementID) === elementID) {
			return;
		}
		defaultReadouts.delete(elementID);
		differenceMap.delete(elementID);
	});
	return differenceMap;
};

const calculateStyleTables = (resultState: ResultState) => {
	const { defaultReadouts, easings } = resultState;
	const styleTableMap = new Map<string, StyleTables>();
	defaultReadouts.forEach((elementReadouts, elementID) => {
		styleTableMap.set(elementID, calculateKeyframeTables(elementReadouts, easings.get(elementID)!));
	});

	return styleTableMap;
};

export const getDefaultKeyframes = (resultState: ResultState) => {
	const differenceMap = filterDifferences(calculateDifferences(resultState), resultState);
	const styleTableMap = calculateStyleTables(resultState);
	setOverrides(resultState);

	differenceMap.forEach((differences, elementID) => {
		const styleTables = styleTableMap.get(elementID)!;
		resultState.keyframes.set(elementID, calculateDefaultKeyframes(differences, styleTables));
	});
};
