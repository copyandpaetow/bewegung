import { highestNumber } from "../prepare/runtime";
import { DifferenceArray, ElementReadouts } from "../types";
import { ImageState } from "./animation-image";
import { calculateDimensionDifferences, save } from "./calculate-dimension-differences";

export const calculateImageKeyframes = (imageState: ImageState, readouts: ElementReadouts[]) => {
	const { maxWidth, maxHeight, ratio, easingTable, keyframes } = imageState;

	//TODO: for very tall images (aspectRatio < 1 (current case 0.66)) this is not perfect, the image is smaller than its wrapper box

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

export const getWrapperKeyframes = (
	imageState: ImageState,
	readouts: ElementReadouts[],
	rootReadouts: ElementReadouts[]
) => {
	const { maxWidth, maxHeight, easingTable, wrapperKeyframes } = imageState;
	readouts.forEach((readout, index) => {
		const horizontalInset = (maxWidth - readout.dimensions.width) / 2;
		const verticalInset = (maxHeight - readout.dimensions.height) / 2;

		const child: DifferenceArray = [readout, readouts.at(-1)!];
		const parent: DifferenceArray = [rootReadouts[index], rootReadouts.at(-1)!];
		const { heightDifference, widthDifference, leftDifference, topDifference } =
			calculateDimensionDifferences(child, parent, false);

		const deltaTop = readout.dimensions.top - readouts.at(-1)!.dimensions.top;
		const deltaLeft = readout.dimensions.left - readouts.at(-1)!.dimensions.left;
		const translateX = -1 * horizontalInset + leftDifference;
		const translateY = -1 * verticalInset + topDifference;

		//TODO: since the root is scaled, the images as children of the root will be affected as well
		//? maybe it is enough to get the root scale and apply it to the delta values and add it as scale
		console.log({ heightDifference });

		wrapperKeyframes.push({
			offset: readout.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				readout.computedStyle.borderRadius!,
				maxHeight,
				maxWidth
			)})`,
			transform: `translate(${translateX}px, ${translateY}px) scale(${widthDifference}, ${heightDifference})`,
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

	//TODO: either we include the root but need to calculate stuff here or we dont include it but need to calculate it somehow still

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
