import { DimensionalDifferences, TreeElement } from "../types";
import { calculateDimensionDifferences, calculateRootDifferences } from "./differences";
import { normalizeBorderRadius } from "./transforms";

export const setDefaultKeyframes = (
	differences: DimensionalDifferences[],
	readouts: TreeElement[],
	hasChangedAspectRatio: boolean
): [Keyframe[]] => {
	//TODO: if border radius is needed, it should go into the overrides
	//TODO: if an element animates from display inline to something else, we would need to override the inline with inline-block
	return [
		differences.map(
			({ leftDifference, topDifference, widthDifference, heightDifference, offset }, index) => {
				const { borderRadius, currentHeight, currentWidth } = readouts[index];
				const normalizedBorderRadius = normalizeBorderRadius(borderRadius, [
					currentWidth,
					currentHeight,
				]);
				const hasCurrentOffset = hasChangedAspectRatio && normalizedBorderRadius;

				return {
					offset,
					transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
					...(hasCurrentOffset && {
						clipPath: `inset(0px round ${normalizedBorderRadius})`,
						borderRadius: "0px",
					}),
				};
			}
		),
	];
};

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
