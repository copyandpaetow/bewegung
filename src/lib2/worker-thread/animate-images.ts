import {
	calculatedElementProperties,
	ChunkOption,
	Chunks,
	Context,
	ElementKey,
	PreAnimation,
} from "../types";
import { calculateEasingMap } from "./calculate-easings";
import { highestNumber } from "./context";

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value)
		? alternative
		: value;
};

const calculateBorderRadius = (
	borderRadius: string,
	height: number,
	width: number
): string => {
	const parsedRadius = parseFloat(borderRadius);

	if (isNaN(parsedRadius)) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return `${(100 * parsedRadius) / width}% / ${(100 * parsedRadius) / height}%`;
};

interface MaximumDimensions {
	width: number;
	height: number;
}
const getMaximumDimensions = (
	styleMap: calculatedElementProperties[]
): MaximumDimensions => {
	const maxHeight = highestNumber(
		styleMap.map((prop) => prop.dimensions.height)
	);

	const maxWidth = highestNumber(styleMap.map((prop) => prop.dimensions.width));

	return {
		width: maxWidth,
		height: maxHeight,
	};
};

const getWrapperStyle = (
	styleMap: calculatedElementProperties[],
	rootStyleMap: calculatedElementProperties[],
	maxValues: { width: number; height: number }
) => {
	const { top: rootTop, left: rootLeft } = rootStyleMap.at(-1)!.dimensions;

	return {
		position: "absolute",
		top: `${styleMap.at(-1)?.dimensions.top! - rootTop}px`,
		left: `${styleMap.at(-1)?.dimensions.left! - rootLeft}px`,
		height: `${maxValues.height}px`,
		width: `${maxValues.width}px`,
		pointerEvents: "none",
		overflow: "hidden",
	} as Partial<CSSStyleDeclaration>;
};

const getWrapperKeyframes = (
	styleMap: calculatedElementProperties[],
	maximumDimensions: MaximumDimensions,
	easingTable: Record<number, string>
) => {
	const { width: maxWidth, height: maxHeight } = maximumDimensions;
	return styleMap.map((entry, _, array): Keyframe => {
		const horizontalInset = (maxWidth - entry.dimensions.width) / 2;
		const verticalInset = (maxHeight - entry.dimensions.height) / 2;

		const deltaTop =
			entry.dimensions.top -
			(array.at(-1)?.dimensions.top || entry.dimensions.top);
		const deltaLeft =
			entry.dimensions.left -
			(array.at(-1)?.dimensions.left || entry.dimensions.left);
		const translateX = -1 * horizontalInset + deltaLeft;
		const translateY = -1 * verticalInset + deltaTop;

		return {
			offset: entry.offset,
			clipPath: `inset(${verticalInset}px ${horizontalInset}px round ${calculateBorderRadius(
				entry.computedStyle.borderRadius!,
				maxHeight,
				maxWidth
			)})`,
			transform: `translate(${translateX}px, ${translateY}px)`,
			easing: easingTable[entry.offset] ?? "ease",
		};
	});
};

const calculateImageKeyframes = (
	styleMap: calculatedElementProperties[],
	maximumDimensions: MaximumDimensions,
	easingTable: Record<number, string>
) => {
	const { width: maxWidth, height: maxHeight } = maximumDimensions;

	return styleMap.map((entry): Keyframe => {
		let scaleWidth: number = entry.dimensions.width / maxWidth;
		let scaleHeight: number = entry.dimensions.height / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

		const originalImageRatio = entry.naturalRatio!;

		if (entry.computedStyle.objectFit === "cover") {
			const alternateScaleWidth = (originalImageRatio * maxHeight) / maxWidth;
			const alternateScaleHeight = maxWidth / originalImageRatio / maxHeight;
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
						parseFloat(value) /
						(index === 0 ? entry.dimensions.width : entry.dimensions.height)
					);
				});

			translateX =
				save((maxWidth * scaleWidth - entry.dimensions.width) / 2, 0) *
				xAchis *
				-1;
			translateY =
				save((maxHeight * scaleHeight - entry.dimensions.height) / 2, 0) *
				yAchis *
				-1;
		}

		return {
			offset: entry.offset,
			transform: `translate(${translateX}px, ${translateY}px) scale(${save(
				scaleWidth,
				1
			)}, ${save(scaleHeight, 1)})`,
			easing: easingTable[entry.offset] ?? "ease",
		};
	});
};

export const getImageAnimations = (
	elementProperties: Map<string, calculatedElementProperties[]>,
	elementState: Map<string, ElementKey>,
	chunkState: Map<string, Chunks>,
	context: Context
): Map<
	string,
	{
		wrapper: PreAnimation;
		image: PreAnimation;
	}
> => {
	const imageAnimationMap = new Map<
		string,
		{ wrapper: PreAnimation; image: PreAnimation }
	>();

	elementState.forEach((elementKey, idString) => {
		if (elementKey.tagName !== "IMG") {
			return;
		}

		const allOptions: ChunkOption[] = [];
		elementKey.dependsOn.forEach((chunkId) => {
			const options = chunkState.get(chunkId)?.options;
			if (!options) {
				return;
			}
			allOptions.push(options);
		});

		const easings = calculateEasingMap(allOptions, context.totalRuntime);

		const styleMap = elementProperties.get(idString)!;
		const rootStyleMap = elementProperties.get(elementKey.root)!;
		const maxDimensions = getMaximumDimensions(styleMap);

		const wrapperStyle = getWrapperStyle(styleMap, rootStyleMap, maxDimensions);

		const wrapperKeyframes = getWrapperKeyframes(
			styleMap,
			maxDimensions,
			easings
		);

		const imageKeyframes = calculateImageKeyframes(
			styleMap,
			maxDimensions,
			easings
		);
		const wrapperAnimation: PreAnimation = {
			keyframes: wrapperKeyframes,
			options: context.totalRuntime,
			overwrite: wrapperStyle,
		};
		const imageAnimation: PreAnimation = {
			keyframes: imageKeyframes,
			options: context.totalRuntime,
			overwrite: {
				cssText: `all: initial; height: ${maxDimensions.height}px; width: ${maxDimensions.width}px; pointer-events: none;`,
			},
		};
		imageAnimationMap.set(idString, {
			wrapper: wrapperAnimation,
			image: imageAnimation,
		});
	});

	return imageAnimationMap;
};
