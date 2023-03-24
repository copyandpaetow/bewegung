import { defaultOptions } from "../shared/constants";
import { DimensionalDifferences, StyleTables } from "../types";

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
