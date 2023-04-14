import { calculateBorderRadius } from "../default/border-radius";
import { getScales, getTranslates } from "../default/calculate-differences";
import { getAbsoluteStyle } from "../default/overrides";
import { DifferenceArray, ImageState } from "../types";
import { save } from "../utils/helper";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const getWrapperStyle = (imageState: ImageState): Partial<CSSStyleDeclaration> => {
	const { parentReadouts, readouts, maxHeight, maxWidth } = imageState;

	return getAbsoluteStyle(readouts, parentReadouts, {
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	});
};

export const calculateImageKeyframes = (imageState: ImageState) => {
	const { maxWidth, maxHeight, easing, readouts } = imageState;

	const keyframes: Keyframe[] = [];

	readouts.forEach((readout) => {
		const ratio = readout.ratio;
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

		keyframes.push({
			offset: readout.offset,
			transform: `translate(${translateX}px, ${translateY}px) scale(${save(scaleWidth, 1)}, ${save(
				scaleHeight,
				1
			)})`,
			easing: easing[readout.offset] ?? "ease",
		});
	});

	return keyframes;
};

export const getWrapperKeyframes = (imageState: ImageState): Keyframe[] => {
	const { maxWidth, maxHeight, easing, readouts, parentReadouts } = imageState;
	return readouts.map((readout) => {
		const correspondingParentEntry = parentReadouts.find(
			(entry) => entry.offset === readout.offset
		)!;
		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [correspondingParentEntry, parentReadouts.at(-1)!];

		const {
			currentLeftDifference,
			referenceLeftDifference,
			currentTopDifference,
			referenceTopDifference,
		} = getTranslates(child, parent);

		const { parentHeightDifference, parentWidthDifference } = getScales(child, parent);

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
