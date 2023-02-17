import { CustomKeyframe, DifferenceArray, ElementReadouts, ImageData } from "../types";
import { getScales, getTranslates, save } from "./calculate-dimension-differences";
import { calculateBorderRadius } from "./calculate-style-tables";

export const getPlaceholderStyle = (readouts: ElementReadouts[]): Partial<CSSStyleDeclaration> => {
	return {
		height: readouts.at(-1)!.unsaveHeight + "px",
		width: readouts.at(-1)!.unsaveWidth + "px",
	};
};

export const getWrapperStyle = (
	readouts: ElementReadouts[],
	parentReadout: ElementReadouts[],
	imageData: ImageData
): CustomKeyframe => {
	const { maxHeight, maxWidth } = imageData;

	return {
		position: "absolute",
		top: `${readouts.at(-1)!.currentTop - parentReadout.at(-1)!.currentTop}px`,
		left: `${readouts.at(-1)!.currentLeft - parentReadout.at(-1)!.currentLeft}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	};
};

export const calculateImageKeyframes = (readouts: ElementReadouts[], imageData: ImageData) => {
	const { maxWidth, maxHeight, easingTable, ratio } = imageData;

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

export const getWrapperKeyframes = (
	readouts: ElementReadouts[],
	parentReadout: ElementReadouts[],
	imageData: ImageData,
	parentEasing: Record<number, string>
): Keyframe[] => {
	const { maxWidth, maxHeight, easingTable } = imageData;
	return readouts.map((readout) => {
		const correspondingParentEntry = parentReadout.find(
			(entry) => entry.offset === readout.offset
		)!;
		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [correspondingParentEntry, parentReadout.at(-1)!];

		const {
			currentLeftDifference,
			referenceLeftDifference,
			currentTopDifference,
			referenceTopDifference,
		} = getTranslates(child, parent);

		const { parentHeightDifference, parentWidthDifference } = getScales(child, parent, false);

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

		console.log({ parentEasing });

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
			easing: easingTable[readout.offset] ?? "ease",
		};
	});
};
