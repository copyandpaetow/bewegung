import { defaultImageStyles } from "../constants";
import {
	DifferenceArray,
	ElementReadouts,
	ImageState,
	ResultTransferable,
	WorkerState,
} from "../types";
import { calculateBorderRadius } from "./border-radius";
import { getScales, getTranslates, save } from "./calculate-dimension-differences";
import { checkForBorderRadius, getNextParent } from "./default-keyframes";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const getWrapperStyle = (imageState: ImageState): Partial<CSSStyleDeclaration> => {
	const { parentReadouts, readouts, maxHeight, maxWidth } = imageState;
	return {
		position: "absolute",
		top: `${readouts.at(-1)!.top - parentReadouts.at(-1)!.top}px`,
		left: `${readouts.at(-1)!.left - parentReadouts.at(-1)!.left}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	};
};

export const calculateImageKeyframes = (imageState: ImageState) => {
	const { maxWidth, maxHeight, easing, ratio, readouts } = imageState;

	const keyframes: Keyframe[] = [];

	readouts.forEach((readout) => {
		let scaleWidth: number = readout.width / maxWidth;
		let scaleHeight: number = readout.height / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		if (readout.objectFit === "cover") {
			const alternateScaleWidth = (ratio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / ratio / maxHeight;
			const currentRatio = readout.width / readout.height;

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
				return parseFloat(value) / (index === 0 ? readout.width : readout.height);
			});

			translateX = save((maxWidth * scaleWidth - readout.width) / 2, 0) * xAchis * -1;
			translateY = save((maxHeight * scaleHeight - readout.height) / 2, 0) * yAchis * -1;
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

		const horizontalInset = (maxWidth - readout.width) / 2;
		const verticalInset = (maxHeight - readout.height) / 2;

		const referenceHorizontalInset = (maxWidth - readouts.at(-1)!.width) / 2;
		const referenceVerticalInset = (maxHeight - readouts.at(-1)!.height) / 2;

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

export const getImageKeyframes = (state: WorkerState, result: ResultTransferable) => {
	const { readouts: allReadouts, imageReadouts, easings, parents, ratios, defaultReadouts } = state;
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
			maxHeight: highestNumber(readouts.map((entry) => entry.height)),
			maxWidth: highestNumber(readouts.map((entry) => entry.width)),
			ratio: ratios.get(elementID)!,
		};

		overrides.set(placeholder, {
			height: readouts.at(-1)!.height + "px",
			width: readouts.at(-1)!.width + "px",
		});

		if (existingParentReadout.at(-1)?.position === "static") {
			overrides.set(existingParent, {
				position: "relative",
			});
			overrideResets.set(existingParent, {
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
