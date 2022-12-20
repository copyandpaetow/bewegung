import { DifferenceArray, ElementReadouts, ImageState } from "../types";
import { getTranslates, save } from "./calculate-dimension-differences";
import { calculateBorderRadius } from "./calculate-style-tables";

export const getPlaceholderStyle = (readouts: ElementReadouts[]): Partial<CSSStyleDeclaration> => {
	return {
		opacity: "0",
		height: readouts.at(-1)!.unsaveHeight + "px",
		width: readouts.at(-1)!.unsaveWidth + "px",
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
		top: `${readouts.at(-1)!.currentTop - rootReadouts.at(-1)!.currentTop}px`,
		left: `${readouts.at(-1)!.currentLeft - rootReadouts.at(-1)!.currentLeft}px`,
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
		let scaleWidth: number = entry.unsaveWidth / maxWidth;
		let scaleHeight: number = entry.unsaveHeight / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (entry.objectFit === "cover") {
			const alternateScaleWidth = (ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / ratio / maxHeight;
			const currentRatio = entry.unsaveWidth / entry.unsaveHeight;

			if (currentRatio < ratio) {
				scaleWidth = alternateScaleWidth * scaleHeight;
			} else {
				scaleHeight = alternateScaleHeight * scaleWidth;
			}
		}

		if (entry.objectPosition !== "50% 50%") {
			const [xAchis, yAchis] = entry.objectPosition!.split(" ").map((value, index) => {
				if (value.includes("%")) {
					return (parseFloat(value) - 100) / 100;
				}
				return parseFloat(value) / (index === 0 ? entry.currentWidth : entry.currentHeight);
			});

			translateX = save((maxWidth * scaleWidth - entry.currentWidth) / 2, 0) * xAchis * -1;
			translateY = save((maxHeight * scaleHeight - entry.currentHeight) / 2, 0) * yAchis * -1;
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
		const correspondingRootEntry =
			rootReadouts.find((entry) => entry.offset === readout.offset) ??
			findCorrespondingElement(readout, rootReadouts, changeTimings);

		const rootScaleY = correspondingRootEntry.currentHeight / rootReadouts.at(-1)!.currentHeight;
		const rootScaleX = correspondingRootEntry.currentWidth / rootReadouts.at(-1)!.currentWidth;

		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [correspondingRootEntry, rootReadouts.at(-1)!];

		const {
			currentLeftDifference,
			referenceLeftDifference,
			currentTopDifference,
			referenceTopDifference,
		} = getTranslates(child, parent);

		const horizontalInset = (maxWidth - readout.currentWidth) / 2;
		const verticalInset = (maxHeight - readout.currentHeight) / 2;

		const referenceHorizontalInset = (maxWidth - readouts.at(-1)!.currentWidth) / 2;
		const referenceVerticalInset = (maxHeight - readouts.at(-1)!.currentHeight) / 2;

		const leftDifference =
			currentLeftDifference / rootScaleX +
			horizontalInset -
			referenceLeftDifference -
			referenceHorizontalInset;
		const topDifference =
			currentTopDifference / rootScaleY +
			verticalInset -
			referenceTopDifference -
			referenceVerticalInset;

		const translateX = leftDifference - (maxWidth - readout.currentWidth) / 2;
		const translateY = topDifference - (maxHeight - readout.currentHeight) / 2;

		return {
			offset: readout.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				readout,
				maxWidth,
				maxHeight
			)})`,
			transform: `translate(${translateX}px, ${translateY}px) scale(${1 / rootScaleX}, ${
				1 / rootScaleY
			})`,
			easing: easingTable[readout.offset] ?? "ease",
		};
	});
};
