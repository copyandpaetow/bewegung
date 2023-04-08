import { defaultImageStyles } from "../constants";
import { DifferenceArray, ImageState, ResultTransferable, WorkerState } from "../types";
import { calculateBorderRadius } from "./border-radius";
import { getScales, getTranslates, save } from "./calculate-dimension-differences";
import { checkForBorderRadius, getNextParent } from "./default-keyframes";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const getWrapperStyle = (imageState: ImageState): Partial<CSSStyleDeclaration> => {
	const { parentReadouts, readouts, maxHeight, maxWidth } = imageState;
	return {
		position: "absolute",
		top: `${readouts.at(-1)!.currentTop - parentReadouts.at(-1)!.currentTop}px`,
		left: `${readouts.at(-1)!.currentLeft - parentReadouts.at(-1)!.currentLeft}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	};
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

const getImageReset = () =>
	Object.fromEntries(Object.entries(defaultImageStyles).map(([key, value]) => [key, ""]));

export const getImageKeyframes = (state: WorkerState, result: ResultTransferable) => {
	const { readouts: allReadouts, imageReadouts, easings, parents, defaultReadouts } = state;
	const { overrides, keyframes, wrappers, placeholders, overrideResets } = result;

	imageReadouts.forEach((readouts, elementID) => {
		const placeholder = `${elementID}-placeholder`;
		const wrapper = `${elementID}-wrapper`;
		const parentID = parents.get(elementID)!;
		const existingParent = getNextParent(parentID, state);
		const existingParentReadout = defaultReadouts.get(existingParent)!;

		const imageState: ImageState = {
			easing: easings.get(elementID)!,
			readouts,
			parentReadouts: allReadouts.get(parentID)!,
			maxHeight: highestNumber(readouts.map((entry) => entry.currentHeight)),
			maxWidth: highestNumber(readouts.map((entry) => entry.currentWidth)),
		};

		overrides.set(placeholder, {
			height: readouts.at(-1)!.unsaveHeight + "px",
			width: readouts.at(-1)!.unsaveWidth + "px",
		});

		if (
			existingParentReadout.at(-1)?.position === "static" &&
			overrides.get(existingParent)?.position === undefined
		) {
			overrides.set(existingParent, {
				...(overrides.get(existingParent) ?? {}),
				position: "relative",
			});
			overrideResets.set(existingParent, {
				...(overrideResets.get(existingParent) ?? {}),
				position: "",
			});
		}

		overrides.set(wrapper, getWrapperStyle(imageState));
		keyframes.set(wrapper, getWrapperKeyframes(imageState));
		keyframes.set(elementID, calculateImageKeyframes(imageState));
		wrappers.set(elementID, wrapper);
		placeholders.set(elementID, placeholder);

		overrides.set(elementID, {
			...(overrides.get(elementID) ?? {}),
			...defaultImageStyles,
		});

		overrideResets.set(elementID, {
			...(overrides.get(elementID) ?? {}),
			...getImageReset(),
		});

		if (readouts.some(checkForBorderRadius)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				borderRadius: "0px",
			});
			overrideResets.set(elementID, {
				...(overrideResets.get(elementID) ?? {}),
				borderRadius: readouts.at(-1)?.borderRadius,
			});
		}
	});
};
