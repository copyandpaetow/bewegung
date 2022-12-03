import { defaultOptions } from "../constants";
import {
	DimensionalDifferences,
	StyleTables,
	ElementReadouts,
	EntryType,
	DifferenceArray,
} from "../types";
import { calculateDimensionDifferences } from "../calculate/dimension-differences";

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
	textNode: EntryType
) => {
	const isTextNode = textNode === "text";

	return readouts.map((readout, index, array) => {
		const child: DifferenceArray = [readout, array.at(-1)!];
		const parent: DifferenceArray | [undefined, undefined] = parentReadouts
			? [parentReadouts[index], parentReadouts.at(-1)!]
			: [undefined, undefined];

		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};
