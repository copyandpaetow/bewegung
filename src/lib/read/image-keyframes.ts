import { highestNumber } from "../prepare/runtime";
import { DifferenceArray, ElementReadouts, ImageState } from "../types";
import { calculateBorderRadius } from "./additional-tables";
import { getTranslates, save } from "./dimension-differences";

export const calculateImageKeyframes = (imageState: ImageState, readouts: ElementReadouts[]) => {
	const { maxWidth, maxHeight, ratio, easingTable, keyframes } = imageState;

	readouts.forEach((entry) => {
		let scaleWidth: number = entry.dimensions.width / maxWidth;
		let scaleHeight: number = entry.dimensions.height / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (entry.computedStyle.objectFit === "cover") {
			const alternateScaleWidth = (ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / ratio / maxHeight;
			const currentRatio = entry.dimensions.width / entry.dimensions.height;

			if (currentRatio < ratio) {
				scaleWidth = alternateScaleWidth * scaleHeight;
			} else {
				scaleHeight = alternateScaleHeight * scaleWidth;
			}
		}

		if (entry.computedStyle.objectPosition !== "50% 50%") {
			const [xAchis, yAchis] = entry.computedStyle
				.objectPosition!.split(" ")
				.map((value, index) => {
					if (value.includes("%")) {
						return (parseFloat(value) - 100) / 100;
					}
					return (
						parseFloat(value) / (index === 0 ? entry.dimensions.width : entry.dimensions.height)
					);
				});

			translateX = save((maxWidth * scaleWidth - entry.dimensions.width) / 2, 0) * xAchis * -1;
			translateY = save((maxHeight * scaleHeight - entry.dimensions.height) / 2, 0) * yAchis * -1;
		}

		keyframes.push({
			offset: entry.offset,
			transform: `translate(${translateX}px, ${translateY}px) scale(${save(scaleWidth, 1)}, ${save(
				scaleHeight,
				1
			)})`,
			easing: easingTable[entry.offset] ?? "ease",
		});
	});
};

export const getWrapperKeyframes = (
	imageState: ImageState,
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[]
) => {
	const { maxWidth, maxHeight, easingTable, wrapperKeyframes } = imageState;
	readouts.forEach((readout, index) => {
		const parentScaleY =
			rootReadouts[index].dimensions.height / rootReadouts.at(-1)!.dimensions.height;
		const parentScaleX =
			rootReadouts[index].dimensions.width / rootReadouts.at(-1)!.dimensions.width;

		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [rootReadouts[index], rootReadouts.at(-1)!];

		const {
			currentLeftDifference,
			referenceLeftDifference,
			currentTopDifference,
			referenceTopDifference,
		} = getTranslates(child, parent);

		const horizontalInset = (maxWidth - readout.dimensions.width) / 2;
		const verticalInset = (maxHeight - readout.dimensions.height) / 2;

		const referenceHorizontalInset = (maxWidth - readouts.at(-1)!.dimensions.width) / 2;
		const referenceVerticalInset = (maxHeight - readouts.at(-1)!.dimensions.height) / 2;

		/*
		TODO: this is still not perfect, the vertical achis is not right (by only 1-2%)
		? however, reworking to this is perfect for the vertical achis but not for the horizontal one (by 30%)
		const leftDifference =
			currentLeftDifference / parentScaleX - referenceLeftDifference + referenceHorizontalInset;
		const topDifference =
			currentTopDifference / parentScaleY - referenceTopDifference + referenceVerticalInset;
		*/

		const leftDifference =
			(currentLeftDifference + horizontalInset) / parentScaleX -
			referenceLeftDifference -
			referenceHorizontalInset;
		const topDifference =
			(currentTopDifference + verticalInset) / parentScaleY -
			referenceTopDifference -
			referenceVerticalInset;

		const translateX = leftDifference - (maxWidth - readout.dimensions.width) / 2;
		const translateY = topDifference - (maxHeight - readout.dimensions.height) / 2;

		wrapperKeyframes.push({
			offset: readout.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				readout,
				maxWidth,
				maxHeight
			)})`,
			transform: `translate(${translateX}px, ${translateY}px) scale(${1 / parentScaleX}, ${
				1 / parentScaleY
			})`,
			easing: easingTable[readout.offset] ?? "ease",
		});
	});
};

export const getWrapperStyle = (
	imageState: ImageState,
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[]
) => {
	const { maxHeight, maxWidth } = imageState;

	return {
		position: "absolute",
		top: `${readouts.at(-1)!.dimensions.top! - rootReadouts.at(-1)!.dimensions.top!}px`,
		left: `${readouts.at(-1)!.dimensions.left! - rootReadouts.at(-1)!.dimensions.left!}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the root element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	} as Partial<CSSStyleDeclaration>;
};

export const getMaximumDimensions = (imageState: ImageState, readouts: ElementReadouts[]) => {
	imageState.maxHeight = highestNumber(readouts.map((prop) => prop.dimensions.height));
	imageState.maxWidth = highestNumber(readouts.map((prop) => prop.dimensions.width));
};
