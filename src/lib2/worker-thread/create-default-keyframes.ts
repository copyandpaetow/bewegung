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
import { findCorrespondingElement } from "./calculate-image-keyframes";
import { calculateKeyframeTables } from "./calculate-style-tables";

const getNextParent = (parentKey: string, resultState: ResultState) => {
	const { parent, defaultReadouts, root } = resultState;
	const isRoot = root.get(parentKey) === parentKey;

	if (defaultReadouts.has(parentKey) || isRoot) {
		return parentKey;
	}
	getNextParent(parent.get(parentKey)!, resultState);
};

const setOverrides = (resultState: ResultState) => {
	const { overrides, root, defaultReadouts } = resultState;

	defaultReadouts.forEach((readouts, key) => {
		const parentKey = getNextParent(key, resultState);
		const parentReadouts = parentKey ? defaultReadouts.get(parentKey) : undefined;
		const isRoot = root.get(key) === key;

		if (isRoot && readouts.at(-1)!.position === "static") {
			overrides.set(key, {
				...(overrides.get(key) ?? {}),
				position: "relative",
			});
		}

		if (checkForDisplayNone(readouts.at(-1)!)) {
			overrides.set(key, {
				...(overrides.get(key) ?? {}),
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
			overrides.set(key, {
				...(overrides.get(key) ?? {}),
				borderRadius: "0px",
			});
		}

		// if (readouts.some(checkForDisplayInline) && type.get(key)! === "text") {
		// 	overrides.set(key, {
		// 		...(overrides.get(key) ?? {}),
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
	const { parent, type, defaultReadouts, changeTimings } = resultState;
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	defaultReadouts.forEach((elementReadouts, elementID) => {
		const parentReadouts = parent.has(elementID)
			? defaultReadouts.get(parent.get(elementID)!)
			: undefined;
		const isText = type.get(elementID)! === "text";

		if (!parentReadouts) {
			const differences = elementReadouts.map((currentReadout) => {
				const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
				return calculateDimensionDifferences(child, [undefined, undefined], isText);
			});
			differenceMap.set(elementID, differences);
			return;
		}

		const differences = elementReadouts.map((currentReadout) => {
			const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
			const correspondingParentEntry =
				parentReadouts?.find((entry) => entry.offset === currentReadout.offset) ??
				findCorrespondingElement(currentReadout, parentReadouts!, changeTimings);

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
	differenceMap.forEach((differences, elementID) => {
		if (differences.some(hasElementChanged)) {
			return;
		}
		resultState.defaultReadouts.delete(elementID);
		differenceMap.delete(elementID);
	});
	return differenceMap;
};

const calculateStyleTables = (resultState: ResultState) => {
	const { affectedBy, options, totalRuntime, defaultReadouts } = resultState;
	const styleTableMap = new Map<string, StyleTables>();
	defaultReadouts.forEach((elementReadouts, elementID) => {
		const easings = new Set<BewegungsOptions>(
			affectedBy.get(elementID)!.flatMap((elementID) => options.get(elementID) ?? [])
		);
		styleTableMap.set(
			elementID,
			calculateKeyframeTables(elementReadouts, [...easings], totalRuntime)
		);
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
