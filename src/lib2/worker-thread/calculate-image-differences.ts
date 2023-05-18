import { calculateBorderRadius } from "./border-radius";
import { getScales, getTranslates } from "./calculate-differences";
import { isElementUnchanged } from "./get-keyframes";
import { EasingTable, ImageDetails, ParentTree, TreeStyle } from "../types";
import { save } from "../utils/helper";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateImageKeyframes = (readouts: TreeStyle[], easing: EasingTable): Keyframe[] => {
	const maxHeight = highestNumber(readouts.map((style) => style.currentHeight));
	const maxWidth = highestNumber(readouts.map((style) => style.currentWidth));

	const differences = readouts.map((readout) => {
		const ratio = parseFloat(readout.ratio);
		let scaleWidth: number = readout.unsaveWidth / maxWidth;
		let scaleHeight: number = readout.unsaveHeight / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (readout.objectFit === "cover") {
			const alternateScaleWidth = (ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / ratio / maxHeight;
			const currentRatio = readout.unsaveWidth / readout.unsaveHeight;

			if (currentRatio < ratio) {
				scaleWidth = alternateScaleWidth * scaleHeight;
			} else {
				scaleHeight = alternateScaleHeight * scaleWidth;
			}
		}
		if (readout.objectPosition !== "50% 50%") {
			const [xAchis, yAchis] = readout.objectPosition!.split(" ").map((value, index) => {
				if (value.includes("%")) {
					return (parseFloat(value) - 100) / 100;
				}
				return parseFloat(value) / (index === 0 ? readout.currentWidth : readout.currentHeight);
			});

			translateX = save((maxWidth * scaleWidth - readout.currentWidth) / 2, 0) * xAchis * -1;
			translateY = save((maxHeight * scaleHeight - readout.currentHeight) / 2, 0) * yAchis * -1;
		}

		return {
			heightDifference: save(scaleHeight, 1),
			widthDifference: save(scaleWidth, 1),
			leftDifference: save(translateX, 0),
			topDifference: save(translateY, 0),
			offset: readout.offset,
		};
	});

	if (differences.every(isElementUnchanged)) {
		return [];
	}

	return differences.map(
		({ heightDifference, widthDifference, topDifference, leftDifference, offset }) => ({
			offset,
			transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
			easing: easing[offset] ?? "ease",
		})
	);
};

export const getWrapperKeyframes = (
	readouts: TreeStyle[],
	parentReadouts: TreeStyle[],
	imageData: ImageDetails
): Keyframe[] => {
	const { easing, maxHeight, maxWidth } = imageData;

	return readouts.map((readout) => {
		const dimensions = {
			current: readout,
			reference: readouts.at(-1)!,
			parent: parentReadouts.find((entry) => entry.offset === readout.offset)!,
			parentReference: parentReadouts.at(-1)!,
		};

		const {
			currentLeftDifference,
			referenceLeftDifference,
			currentTopDifference,
			referenceTopDifference,
		} = getTranslates(dimensions);

		const { parentHeightDifference, parentWidthDifference } = getScales(dimensions);

		const horizontalInset = (maxWidth - readout.currentWidth) / 2;
		const verticalInset = (maxHeight - readout.currentHeight) / 2;

		const referenceHorizontalInset = (maxWidth - readouts.at(-1)!.currentWidth) / 2;
		const referenceVerticalInset = (maxHeight - readouts.at(-1)!.currentHeight) / 2;

		const translateX =
			(currentLeftDifference - referenceLeftDifference) / parentWidthDifference -
			referenceHorizontalInset;
		const translateY =
			(currentTopDifference - referenceTopDifference) / parentHeightDifference -
			referenceVerticalInset;

		return {
			offset: readout.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				readout,
				maxWidth,
				maxHeight
			)})`,
			transform: `translate(${translateX}px, ${translateY}px) scale(${1 / parentWidthDifference}, ${
				1 / parentHeightDifference
			})`,
			easing: easing[readout.offset] ?? "ease",
		};
	});
};
