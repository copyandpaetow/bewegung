import { Context } from "vm";
import { save } from "./calculate-dimension-differences";
import { StyleState, applyCSSStyles } from "./calculate-dom-changes";
import { emptyImageSrc } from "./constants";
import { CallbackState } from "./get-callback-state";
import { highestNumber } from "./get-context";
import { calculatedElementProperties } from "./types";

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

const getPlaceholderElement = (element: HTMLImageElement) => {
	const placeholderImage = element.cloneNode() as HTMLImageElement;
	placeholderImage.src = false ? emptyImageSrc : element.src;
	placeholderImage.style.opacity = "0";

	return placeholderImage;
};

const getWrapperElement = (wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyCSSStyles(wrapper, wrapperStyle);
	return wrapper;
};

const getWrapperStyle = (
	styleMap: calculatedElementProperties[],
	rootStyleMap: calculatedElementProperties[],
	maxValues: { width: number; height: number }
) => {
	const { top: rootTop, left: rootLeft } = rootStyleMap?.at(-1)?.dimensions!;

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

const calculateImageKeyframes = (
	styleMap: calculatedElementProperties[],
	maximumDimensions: MaximumDimensions,
	easingTable: Record<number, string>,
	originalImageRatio: number
) => {
	const { width: maxWidth, height: maxHeight } = maximumDimensions;

	return styleMap.map((entry): Keyframe => {
		let scaleWidth: number = entry.dimensions.width / maxWidth;
		let scaleHeight: number = entry.dimensions.height / maxHeight;

		let translateX: number = 0;
		let translateY: number = 0;

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

const getImageBeforeAnimationCallback = (
	element: HTMLImageElement,
	wrapper: HTMLElement,
	placeholderImage: HTMLElement,
	maximumDimensions: MaximumDimensions
) => {
	const { width: maxWidth, height: maxHeight } = maximumDimensions;
	const nextSibling = element.nextElementSibling;
	const parent = element.parentElement;

	nextSibling
		? parent?.insertBefore(placeholderImage, nextSibling)
		: parent?.appendChild(placeholderImage);

	element.style.cssText = `all: initial; height: ${maxWidth}px; width: ${maxHeight}px; pointer-events: none;`;

	wrapper.appendChild(element);
	document.body.appendChild(wrapper);
};

interface CalculateImageAnimationProps {
	element: HTMLImageElement;
	styleState: StyleState;
	context: Context;
	calculateEasing: Record<number, string>;
}

interface CalculateImageAnimation {
	imageAnimation: Animation[];
	beforeImageCallback: VoidFunction;
	afterImageCallback: VoidFunction;
}

export const calculateImageAnimation = (
	props: CalculateImageAnimationProps
): CalculateImageAnimation => {
	const { element, styleState, context, calculateEasing } = props;

	const styleMap = styleState.getElementProperties(element)!;
	const rootStyleMap = styleState.getElementProperties(document.body)!;
	const maxDimensions = getMaximumDimensions(styleMap);

	const wrapper = getWrapperElement(
		getWrapperStyle(styleMap, rootStyleMap, maxDimensions)
	);

	const placeholderImage = getPlaceholderElement(element);

	const originalImageRatio = element.naturalWidth / element.naturalHeight;

	const wrapperKeyframes = getWrapperKeyframes(
		styleMap,
		maxDimensions,
		calculateEasing
	);

	const imageKeyframes = calculateImageKeyframes(
		styleMap,
		maxDimensions,
		calculateEasing,
		originalImageRatio
	);

	return {
		imageAnimation: [
			new Animation(
				new KeyframeEffect(wrapper, wrapperKeyframes, context.totalRuntime)
			),
			new Animation(
				new KeyframeEffect(element, imageKeyframes, context.totalRuntime)
			),
		],
		beforeImageCallback: () =>
			getImageBeforeAnimationCallback(
				element,
				wrapper,
				placeholderImage,
				maxDimensions
			),
		afterImageCallback: () => {
			element.parentElement?.replaceChild(element, placeholderImage);
			element.style.cssText = styleState.getOriginalStyle(element)!;
			wrapper.remove();
		},
	};
};