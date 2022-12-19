import { defaultOptions } from "../constants";
import {
	DimensionalDifferences,
	StyleTables,
	ElementReadouts,
	EntryType,
	DifferenceArray,
} from "../types";
import { calculateDimensionDifferences } from "../calculate/dimension-differences";
import { findCorrespondingElement } from "./image-calculations";

export const calculateDefaultKeyframes = (
	calculations: DimensionalDifferences[],
	styleTables: StyleTables
) => {
	const { easingTable, userTransformTable, borderRadiusTable, opacityTable, filterTable } =
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

export const getCalcualtionsFromReadouts = (
	readouts: ElementReadouts[],
	parentReadouts: ElementReadouts[] | undefined,
	textNode: EntryType,
	changeTimings: number[]
) => {
	const isTextNode = textNode === "text";

	//TODO: these could be different. We need to get the curretn offset and search the parent entry for that or everything after

	return readouts.map((readout) => {
		const child: DifferenceArray = [readout, readouts.at(-1)!];

		if (!parentReadouts) {
			return calculateDimensionDifferences(child, [undefined, undefined], isTextNode);
		}

		const correspondingParentEntry =
			parentReadouts?.find((entry) => entry.offset === readout.offset) ??
			findCorrespondingElement(readout, parentReadouts!, changeTimings);

		return calculateDimensionDifferences(
			child,
			[correspondingParentEntry, parentReadouts.at(-1)!],
			isTextNode
		);
	});
};
