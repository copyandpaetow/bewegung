import { DimensionalDifferences, ImageDetails, TreeEntry, TreeMedia } from "../types";
import { save } from "../utils/helper";
import { calculateBorderRadius } from "./border-radius";
import { getScales, getTranslates } from "./calculate-differences";
import { getImageData } from "./get-keyframes";

export const calculateImageDifferences = (readouts: TreeMedia[]): Keyframe[] => {
	const { maxHeight, maxWidth } = getImageData(readouts);

	return readouts.map((readout) => {
		let scaleWidth: number = readout.unsaveWidth / maxWidth;
		let scaleHeight: number = readout.unsaveHeight / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (readout.objectFit === "cover") {
			const alternateScaleWidth = (readout.ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / readout.ratio / maxHeight;
			const currentRatio = readout.unsaveWidth / readout.unsaveHeight;

			if (currentRatio < readout.ratio) {
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
			transform: `translate(${save(translateX, 0)}px, ${save(translateY, 0)}px) scale(${save(
				scaleWidth,
				1
			)}, ${save(scaleHeight, 1)})`,
			id: readout.key + "-wrapper",
			offset: readout.offset,
		};
	});
};

export const getWrapperKeyframes = (
	readouts: TreeMedia[],
	parentReadouts: TreeEntry[] | undefined,
	imageData: ImageDetails
): Keyframe[] => {
	const { maxHeight, maxWidth } = imageData;
	const reference = readouts.at(-1)!;
	const parentReference = parentReadouts?.at(-1)! ?? reference;

	return readouts.map((readout, index) => {
		const dimensions = {
			current: readout,
			reference,
			parent: parentReadouts?.at(index) ?? readout,
			parentReference,
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
			id: readout.key + "-wrapper",
		};
	});
};
