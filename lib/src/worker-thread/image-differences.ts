import { DimensionalDifferences, TreeElement } from "../types";
import { save } from "../utils/helper";
import { normalizeBorderRadius } from "./transforms";

export const setImageKeyframes = (
	differences: DimensionalDifferences[],
	readouts: TreeElement[]
): [Keyframe[], Partial<CSSStyleDeclaration>] => {
	return [
		readouts.map((readout, index) => {
			const xScale = Math.max(1, (readout.currentHeight * readout.ratio) / readout.currentWidth);
			const yScale = Math.max(1, readout.currentWidth / (readout.currentHeight * readout.ratio));

			const resultingWidth = readout.currentWidth * xScale;
			const resultingHeight = readout.currentHeight * yScale;

			const clipWidthDifference = Math.max(
				0,
				(resultingWidth - readout.currentWidth) / (2 * xScale)
			);
			const clipHeightDifference = Math.max(
				0,
				(resultingHeight - readout.currentHeight) / (2 * yScale)
			);
			const normalizedBorderRadius = normalizeBorderRadius(readout.borderRadius, [
				resultingWidth,
				resultingHeight,
			]);

			const withBorderRadius = normalizedBorderRadius ? `round ${normalizedBorderRadius}` : "";

			return {
				clipPath: `inset(${clipHeightDifference}px ${clipWidthDifference}px ${withBorderRadius})`,
				transform: `translate(${differences[index].leftDifference}px, ${
					differences[index].topDifference
				}px) scale(${save(xScale * differences[index].widthDifference, 1)}, ${save(
					yScale * differences[index].heightDifference,
					1
				)})`,
				offset: readout.offset,
			};
		}),
		{ objectFit: "unset", borderRadius: "0" },
	];
};
