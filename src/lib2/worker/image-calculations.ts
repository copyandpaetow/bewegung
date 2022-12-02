import { getTranslates, save } from "../read/dimension-differences";
import { DifferenceArray, ElementReadouts, ImageState, WorkerState } from "../types";
import { calculateBorderRadius } from "./style-tables";

export const getPlaceholderStyle = (readouts: ElementReadouts[]): Partial<CSSStyleDeclaration> => {
	return {
		opacity: "0",
		height: readouts.at(-1)!.dimensions.height + "px",
		width: readouts.at(-1)!.dimensions.width + "px",
	};
};

export const getWrapperStyle = (
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[],
	imageState: ImageState
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

export const initialImageState = (): ImageState => ({
	wrapperStyle: {},
	placeholderStyle: {},
	maxWidth: 0,
	maxHeight: 0,
	easingTable: {},
	wrapperKeyframes: [],
	keyframes: [],
	overrides: {
		before: {},
		after: {},
	},
});

export const calculateImageKeyframes = (readouts: ElementReadouts[], imageState: ImageState) => {
	const { maxWidth, maxHeight, easingTable } = imageState;

	const keyframes: Keyframe[] = [];

	readouts.forEach((entry) => {
		let scaleWidth: number = entry.dimensions.width / maxWidth;
		let scaleHeight: number = entry.dimensions.height / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (entry.computedStyle.objectFit === "cover") {
			const alternateScaleWidth = (entry.ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / entry.ratio / maxHeight;
			const currentRatio = entry.dimensions.width / entry.dimensions.height;

			if (currentRatio < entry.ratio) {
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
	return keyframes;
};

export const getWrapperKeyframes = (
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[],
	imageState: ImageState
) => {
	const { maxWidth, maxHeight, easingTable, wrapperKeyframes } = imageState;
	const keyframes: Keyframe[] = [];
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

		keyframes.push({
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
	return keyframes;
};
