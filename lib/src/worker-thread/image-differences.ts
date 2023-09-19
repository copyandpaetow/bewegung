import { ImageDetails, ObjectFit, TreeElement } from "../types";
import { save } from "../utils/helper";
import { getScales, getTranslates } from "./differences";
import { getImageData } from "./image-keyframes";
import { normalizeBorderRadius } from "./transforms";

//TODO: this was written when there where more than 2 readouts, maybe it can be reduced / simplified?
export const calculateImageDifferences = (readouts: TreeElement[]): Keyframe[] => {
	const { maxHeight, maxWidth } = getImageData(readouts);

	return readouts.map((readout) => {
		let scaleWidth: number = readout.unsaveWidth / maxWidth;
		let scaleHeight: number = readout.unsaveHeight / maxHeight;

		if (readout.objectFit === ObjectFit.cover) {
			const alternateScaleWidth = (readout.ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / readout.ratio / maxHeight;
			const currentRatio = readout.unsaveWidth / readout.unsaveHeight;

			if (currentRatio < readout.ratio) {
				scaleWidth = alternateScaleWidth * scaleHeight;
			} else {
				scaleHeight = alternateScaleHeight * scaleWidth;
			}
		}
		//TODO: this needs to be re-checked
		const [xAchis, yAchis] = readout.objectPosition;
		const translateX = save((maxWidth * scaleWidth - readout.currentWidth) / 2, 0) * xAchis * -1;
		const translateY = save((maxHeight * scaleHeight - readout.currentHeight) / 2, 0) * yAchis * -1;

		return {
			transform: `translate(${save(translateX, 0)}px, ${save(translateY, 0)}px) scale(${save(
				scaleWidth,
				1
			)}, ${save(scaleHeight, 1)})`,
			offset: readout.offset,
		};
	});
};

//TODO: this was written when there where more than 2 readouts, maybe it can be reduced / simplified?
export const getWrapperKeyframes = (
	readouts: TreeElement[],
	parentReadouts: TreeElement[] | undefined,
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
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${normalizeBorderRadius(
				readout.borderRadius,
				[maxWidth, maxHeight]
			)})`,
			transform: `translate(${translateX}px, ${translateY}px) scale(${1 / parentWidthDifference}, ${
				1 / parentHeightDifference
			})`,
		};
	});
};
