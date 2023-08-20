import { DimensionalDifferences, ImageDetails, TreeEntry, TreeMedia } from "../types";
import { calculateBorderRadius } from "./border-radius";

export const getBorderRadius = (readouts: TreeEntry[]) => {
	const styleTable = new Map<number, string>();

	readouts.forEach((style, offset) => {
		if (style.borderRadius === "0px") {
			return;
		}
		styleTable.set(offset, calculateBorderRadius(style));
	});

	return styleTable;
};

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

export const getImageData = (readouts: TreeMedia[]): ImageDetails => {
	let maxHeight = 0;
	let maxWidth = 0;

	readouts.forEach((style) => {
		maxHeight = Math.max(maxHeight, style.currentHeight);
		maxWidth = Math.max(maxWidth, style.currentWidth);
	});

	return { maxHeight, maxWidth };
};
