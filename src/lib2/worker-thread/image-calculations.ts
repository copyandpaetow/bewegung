import { getTranslates, save } from "./calculate-dimension-differences";
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
	ratio: 0,
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
	const { maxWidth, maxHeight, easingTable, ratio } = imageState;

	const keyframes: Keyframe[] = [];

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
	return keyframes;
};

//TODO: REFACTOR: change the structure into something more performant
export const findCorrespondingElement = (
	currentReadout: ElementReadouts,
	rootReadouts: ElementReadouts[],
	changeTimings: number[]
) => {
	if (rootReadouts.length === 1) {
		return rootReadouts[0];
	}

	const offsetPosition = changeTimings.findIndex((offset) => offset === currentReadout.offset);
	const partialChangeTimings = changeTimings.slice(offsetPosition);
	let result = currentReadout;

	partialChangeTimings.some((offset) => {
		const resultAtCurrentOffset = rootReadouts.find((readout) => readout.offset === offset);
		if (resultAtCurrentOffset) {
			result = resultAtCurrentOffset;
			return true;
		}
		return false;
	})!;

	return result;
};

//TODO: REFACTOR: split into smaller chunks
export const getWrapperKeyframes = (
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[],
	imageState: ImageState,
	changeTimings: number[]
): Keyframe[] => {
	const { maxWidth, maxHeight, easingTable } = imageState;

	return readouts.map((readout) => {
		const correspondingParentEntry =
			rootReadouts.find((entry) => entry.offset === readout.offset) ??
			findCorrespondingElement(readout, rootReadouts, changeTimings);

		const parentScaleY =
			correspondingParentEntry.dimensions.height / rootReadouts.at(-1)!.dimensions.height;
		const parentScaleX =
			correspondingParentEntry.dimensions.width / rootReadouts.at(-1)!.dimensions.width;

		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [correspondingParentEntry, rootReadouts.at(-1)!];

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

		const leftDifference =
			currentLeftDifference / parentScaleX +
			horizontalInset -
			referenceLeftDifference -
			referenceHorizontalInset;
		const topDifference =
			currentTopDifference / parentScaleY +
			verticalInset -
			referenceTopDifference -
			referenceVerticalInset;

		const translateX = leftDifference - (maxWidth - readout.dimensions.width) / 2;
		const translateY = topDifference - (maxHeight - readout.dimensions.height) / 2;

		return {
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
		};
	});
};
