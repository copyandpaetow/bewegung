import { DimensionalDifferences, TreeEntry } from "../types";
import { getBorderRadius } from "./border-radius";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";

export const changesInScale = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.heightDifference !== entry.widthDifference &&
			(entry.heightDifference !== 1 || entry.widthDifference !== 1)
	);

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
