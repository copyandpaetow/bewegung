import { DimensionalDifferences, TreeEntry } from "../types";
import { getBorderRadius } from "./border-radius";
import { calculateDimensionDifferences, calculateRootDifferences } from "./differences";

export const setDefaultKeyframes = (
	differences: DimensionalDifferences[],
	readouts: TreeEntry[],
	isChangingInScale: boolean
): Keyframe[] => {
	const borderRadius = isChangingInScale ? getBorderRadius(readouts) : new Map();

	return differences.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }) => {
			return {
				offset,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
				...(borderRadius.has(offset) && {
					clipPath: borderRadius.get(offset) ? `inset(0px round ${borderRadius.get(offset)})` : "",
					borderRadius: "0px",
				}),
			};
		}
	);
};

//TODO: this was written when there where more than 2 readouts, maybe it can be reduced / simplified?
export const calculateDifferences = (current: TreeEntry[], parent: TreeEntry[] | undefined) => {
	if (!parent) {
		return current.map((entry) =>
			calculateRootDifferences({
				current: entry,
				reference: current.at(-1)!,
			})
		);
	}

	return current.map((entry, index) =>
		calculateDimensionDifferences({
			current: entry,
			reference: current.at(-1)!,
			parent: parent![index],
			parentReference: parent!.at(-1)!,
		})
	);
};
