import { highestNumber } from "../prepare/runtime";
import { ElementReadouts, MaximumDimensions } from "../types";
import { ImageState } from "./animation-image";
import { save } from "./calculate-dimension-differences";

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

			if (currentRatio <= 1) {
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

const calculateBorderRadius = (borderRadius: string, height: number, width: number): string => {
	const parsedRadius = parseFloat(borderRadius);

	if (isNaN(parsedRadius)) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return `${(100 * parsedRadius) / width}% / ${(100 * parsedRadius) / height}%`;
};

export const getWrapperKeyframes = (imageState: ImageState, readouts: ElementReadouts[]) => {
	const { maxWidth, maxHeight, easingTable, wrapperKeyframes } = imageState;
	readouts.forEach((entry, _, array) => {
		const horizontalInset = (maxWidth - entry.dimensions.width) / 2;
		const verticalInset = (maxHeight - entry.dimensions.height) / 2;

		const deltaTop = entry.dimensions.top - (array.at(-1)?.dimensions.top || entry.dimensions.top);
		const deltaLeft =
			entry.dimensions.left - (array.at(-1)?.dimensions.left || entry.dimensions.left);
		const translateX = -1 * horizontalInset + deltaLeft;
		const translateY = -1 * verticalInset + deltaTop;

		wrapperKeyframes.push({
			offset: entry.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				entry.computedStyle.borderRadius!,
				maxHeight,
				maxWidth
			)})`,
			transform: `translate(${translateX}px, ${translateY}px)`,
			easing: easingTable[entry.offset] ?? "ease",
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
		top: `${readouts.at(-1)?.dimensions.top! - rootReadouts.at(-1)?.dimensions.top!}px`,
		left: `${readouts.at(-1)?.dimensions.left! - rootReadouts.at(-1)?.dimensions.left!}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
	} as Partial<CSSStyleDeclaration>;
};

export const getMaximumDimensions = (imageState: ImageState, readouts: ElementReadouts[]) => {
	imageState.maxHeight = highestNumber(readouts.map((prop) => prop.dimensions.height));
	imageState.maxWidth = highestNumber(readouts.map((prop) => prop.dimensions.width));
};
