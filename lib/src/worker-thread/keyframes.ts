import { DimensionalDifferences, TreeElement } from "../types";
import { isImage } from "../utils/predicates";
import { calculateDimensionDifferences, calculateRootDifferences } from "./differences";
import { normalizeBorderRadius } from "./transforms";

export const setDefaultKeyframes = (
	differences: DimensionalDifferences[],
	readouts: TreeElement[],
	isChangingInScale: boolean
): Keyframe[] => {
	return differences.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }, index) => {
			const { borderRadius, currentHeight, currentWidth } = readouts[index];
			const normalizedBorderRadius = normalizeBorderRadius(borderRadius, [
				currentWidth,
				currentHeight,
			]);
			const hasCurrentOffset = isChangingInScale && normalizedBorderRadius;

			return {
				offset,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
				...(hasCurrentOffset && {
					clipPath: `inset(0px round ${normalizedBorderRadius})`,
					borderRadius: "0px",
				}),
			};
		}
	);
};

//TODO: this was written when there where more than 2 readouts, maybe it can be reduced / simplified?
export const calculateDifferences = (current: TreeElement[], parent: TreeElement[] | undefined) => {
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
