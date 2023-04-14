import { defaultOptions } from "../utils/constants";
import {
	AllReadoutTypes,
	AllReadouts,
	DefaultReadouts,
	DefaultTransferable,
	DifferenceArray,
	DimensionalDifferences,
	StyleTables,
	WorkerState,
} from "../types";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import { calculateStyleTables } from "./calculate-style-tables";
import { refillPartialKeyframes } from "./refill-keyframes";
import { setOverrides } from "./overrides";

const hasElementChanged = (entry: DimensionalDifferences) =>
	entry.heightDifference !== 1 ||
	entry.leftDifference !== 0 ||
	entry.topDifference !== 0 ||
	entry.widthDifference !== 1;

export const filterDifferences = (
	differenceMap: Map<string, DimensionalDifferences[]>,
	defaultReadouts: Map<string, DefaultReadouts[]>,
	parents: Map<string, string>
) => {
	differenceMap.forEach((differences, elementID) => {
		const isRoot = parents.get(elementID)! === elementID;
		if (isRoot || differences.some(hasElementChanged)) {
			return;
		}
		defaultReadouts.delete(elementID);
		differenceMap.delete(elementID);
		console.log(elementID);
	});

	return differenceMap;
};

const calculateDifferences = (
	defaultReadouts: Map<string, DefaultReadouts[]>,
	parents: Map<string, string>
) => {
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	defaultReadouts.forEach((elementReadouts, elementID) => {
		const parentReadouts = defaultReadouts.get(parents.get(elementID)!)!;
		const isRoot = parents.get(elementID)! === elementID;

		if (isRoot) {
			const differences = elementReadouts.map((currentReadout) =>
				calculateRootDifferences([currentReadout, elementReadouts.at(-1)!])
			);
			differenceMap.set(elementID, differences);
			return;
		}

		const differences = elementReadouts.map((currentReadout) => {
			const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
			const correspondingParentEntry = parentReadouts?.find(
				(entry) => entry.offset === currentReadout.offset
			)!;
			const parentReadout: DifferenceArray = [correspondingParentEntry, parentReadouts.at(-1)!];

			return calculateDimensionDifferences(child, parentReadout);
		});

		differenceMap.set(elementID, differences);
	});

	return differenceMap;
};

export const getNextParent = <Value extends AllReadouts>(
	elementID: string,
	parents: Map<string, string>,
	...readouts: Value[]
): string => {
	const parentID = parents.get(elementID)!;
	const isRoot = parentID === elementID;

	if (isRoot) {
		return elementID;
	}
	if (readouts.some((readout) => readout.has(parentID))) {
		return parentID;
	}

	return getNextParent(parentID, parents, ...readouts);
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

export const getDefaultKeyframes = (state: WorkerState): DefaultTransferable => {
	const { defaultReadouts, parents, timings } = state;
	const keyframes = new Map<string, Keyframe[]>();
	const partialElements = refillPartialKeyframes(defaultReadouts, timings);

	const differenceMap = filterDifferences(
		calculateDifferences(defaultReadouts, parents),
		defaultReadouts,
		parents
	);
	//TODO: it doesnt realy make sense to have this only for the default readouts. In general there are some properties we might want to animate as well
	const styleTableMap = calculateStyleTables(state);

	differenceMap.forEach((differences, elementID) => {
		const styleTables = styleTableMap.get(elementID)!;
		const keyframe = calculateDefaultKeyframes(differences, styleTables);

		if (partialElements.has(elementID)) {
			partialElements.set(elementID, keyframe);
			return;
		}

		keyframes.set(elementID, keyframe);
	});
	const overrides = setOverrides(defaultReadouts, partialElements, state);

	return {
		keyframes,
		partialElements,
		overrides,
	};
};
