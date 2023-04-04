import { defaultOptions } from "../constants";
import {
	ElementReadouts,
	WorkerState,
	ResultTransferable,
	DimensionalDifferences,
	DifferenceArray,
	StyleTables,
} from "../types";
import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { calculateStyleTables } from "./calculate-style-tables";

const hasElementChanged = (entry: DimensionalDifferences) =>
	entry.heightDifference !== 1 ||
	entry.leftDifference !== 0 ||
	entry.topDifference !== 0 ||
	entry.widthDifference !== 1;

const filterDifferences = (
	differenceMap: Map<string, DimensionalDifferences[]>,
	state: WorkerState
) => {
	const { defaultReadouts, parents } = state;

	differenceMap.forEach((differences, elementID) => {
		const isRoot = parents.get(elementID)! === elementID;
		if (differences.some(hasElementChanged) || isRoot) {
			return;
		}
		defaultReadouts.delete(elementID);
		differenceMap.delete(elementID);
	});

	return differenceMap;
};

const calculateDifferences = (state: WorkerState) => {
	const { defaultReadouts, parents, types } = state;
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	defaultReadouts.forEach((elementReadouts, elementID) => {
		const parentReadouts = defaultReadouts.get(parents.get(elementID)!)!;
		const isText = types.has(elementID);

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

export const getNextParent = (elementID: string, state: WorkerState): string => {
	const { parents, defaultReadouts } = state;
	const parentID = parents.get(elementID)!;
	const isRoot = parentID === elementID;

	if (isRoot) {
		return elementID;
	}
	if (defaultReadouts.has(parentID)) {
		return parentID;
	}

	return getNextParent(parentID, state);
};

export const checkForDisplayNone = (entry: ElementReadouts) => entry.display === "none";
export const checkForBorderRadius = (entry: ElementReadouts) => entry.borderRadius !== "0px";

const setOverrides = (state: WorkerState, result: ResultTransferable) => {
	const { defaultReadouts } = state;
	const { overrides } = result;

	defaultReadouts.forEach((readouts, elementID) => {
		const parentKey = getNextParent(elementID, state);
		const parentReadouts = parentKey ? defaultReadouts.get(parentKey) : undefined;

		if (checkForDisplayNone(readouts.at(-1)!)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				display: "",
				position: "absolute",
				left: readouts.at(-1)!.left - (parentReadouts?.at(-1)!.left ?? 0) + "px",
				top: readouts.at(-1)!.top - (parentReadouts?.at(-1)!.top ?? 0) + "px",
				width: readouts.at(-1)!.width + "px",
				height: readouts.at(-1)!.height + "px",
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
	});
};

export const calculateDefaultKeyframes = (
	calculations: DimensionalDifferences[],
	styleTables: StyleTables
) => {
	const { userTransformTable, borderRadiusTable, opacityTable, filterTable, easingTable } =
		styleTables;

	return calculations.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }) =>
			({
				offset,
				composite: "auto",
				easing: easingTable[offset] ?? defaultOptions.easing,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference}) ${
					userTransformTable[offset] ? userTransformTable[offset] : ""
				} `,
				...(borderRadiusTable[offset] && {
					clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
				}),
				...(opacityTable[offset] && {
					opacity: `${opacityTable[offset]}`,
				}),
				...(filterTable[offset] && {
					filter: `${filterTable[offset]}`,
				}),
			} as Keyframe)
	);
};

export const getDefaultKeyframes = (state: WorkerState, result: ResultTransferable) => {
	const differenceMap = filterDifferences(calculateDifferences(state), state);
	const styleTableMap = calculateStyleTables(state);
	setOverrides(state, result);

	differenceMap.forEach((differences, elementID) => {
		const styleTables = styleTableMap.get(elementID)!;
		result.keyframes.set(elementID, calculateDefaultKeyframes(differences, styleTables));
	});
};
