import {
	checkForBorderRadius,
	checkForDisplayInline,
	checkForDisplayNone,
	offsetObjectsAreEqual,
} from "../shared/utils";
import {
	BewegungsOptions,
	DifferenceArray,
	DimensionalDifferences,
	ElementReadouts,
	ResultState,
	StyleTables,
} from "../types";
import { calculateDefaultKeyframes } from "./calculate-default-keyframes";
import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { findCorrespondingElement } from "./calculate-image-keyframes";
import { calculateKeyframeTables } from "./calculate-style-tables";

const setOverrides = (resultState: ResultState) => {
	const { overrides, parent, type, defaultReadouts } = resultState;

	defaultReadouts.forEach((readouts, key) => {
		const parentKey = parent.get(key);
		const parentReadouts = parentKey ? defaultReadouts.get(parentKey) : undefined;

		if (!parentKey && readouts.at(-1)!.position === "static") {
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
			});

			if (!parentKey || parentReadouts!.at(-1)!.position === "static") {
				return;
			}
			overrides.set(parentKey, {
				...(overrides.get(parentKey) ?? {}),
				position: "relative",
			});
		}

		if (readouts.some(checkForBorderRadius)) {
			overrides.set(key, {
				...(overrides.get(key) ?? {}),
				borderRadius: "0px",
			});
		}

		if (readouts.some(checkForDisplayInline) && type.get(key)! === "text") {
			overrides.set(key, {
				...(overrides.get(key) ?? {}),
				display: "inline-block",
			});
		}
	});
};

const getAnchorParents = (
	readouts: Map<string, ElementReadouts[]>,
	parentMap: Map<string, string>
) => {
	const anchorParents = new Set<string>();
	readouts.forEach((elementReadouts, elementString) => {
		if (!checkForDisplayNone(elementReadouts.at(-1)!)) {
			return;
		}
		const parentKey = parentMap.get(elementString);
		const withRoot = parentKey || elementString;
		anchorParents.add(withRoot);
	});

	return anchorParents;
};

const calculateDifferences = (resultState: ResultState): Map<string, DimensionalDifferences[]> => {
	const { parent, type, defaultReadouts, changeTimings } = resultState;
	const anchorParents = getAnchorParents(defaultReadouts, parent);
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	defaultReadouts.forEach((elementReadouts, elementString) => {
		const parentReadouts = parent.has(elementString)
			? defaultReadouts.get(parent.get(elementString)!)
			: undefined;
		const isText = type.get(elementString)! === "text";

		if (!parentReadouts) {
			const differences = elementReadouts.map((currentReadout) => {
				const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
				return calculateDimensionDifferences(child, [undefined, undefined], isText);
			});
			differenceMap.set(elementString, differences);
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

		// if (
		// 	!anchorParents.has(elementString) &&
		// 	differences.every((entry) => offsetObjectsAreEqual(entry, differences.at(-1)!))
		// ) {
		// 	defaultReadouts.delete(elementString);
		// 	return;
		// }
		differenceMap.set(elementString, differences);
	});

	return differenceMap;
};

const calculateStyleTables = (resultState: ResultState) => {
	const { affectedBy, options, totalRuntime, defaultReadouts } = resultState;
	const styleTableMap = new Map<string, StyleTables>();
	defaultReadouts.forEach((elementReadouts, elementString) => {
		const easings = new Set<BewegungsOptions>(
			affectedBy.get(elementString)!.flatMap((elementString) => options.get(elementString) ?? [])
		);
		styleTableMap.set(
			elementString,
			calculateKeyframeTables(elementReadouts, [...easings], totalRuntime)
		);
	});

	return styleTableMap;
};

export const getDefaultKeyframes = (resultState: ResultState) => {
	const { keyframes } = resultState;
	const differenceMap = calculateDifferences(resultState);
	const styleTableMap = calculateStyleTables(resultState);
	setOverrides(resultState);

	differenceMap.forEach((differences, elementString) => {
		const styleTables = styleTableMap.get(elementString)!;
		keyframes.set(elementString, calculateDefaultKeyframes(differences, styleTables));
	});
};
