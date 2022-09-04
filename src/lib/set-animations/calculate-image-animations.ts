import { emptyImageSrc } from "../constants";
import { highestNumber } from "../prepare-input/context";
import {
	calculatedElementProperties,
	Context,
	ElementKey,
	StyleState,
} from "../types";
import { save } from "./calculate-dimension-differences";
import { applyStyleObject, restoreOriginalStyle } from "./read-dom";

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
	const placeholder = document.createElement("img");

	element.getAttributeNames().forEach((attribute) => {
		placeholder.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholder.src = emptyImageSrc;
	placeholder.style.opacity = "0";

	return placeholder;
};

const getWrapperElement = (wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyStyleObject(wrapper, wrapperStyle);
	return wrapper;
};

const getWrapperStyle = (
	styleMap: calculatedElementProperties[],
	rootDimensions: DOMRect,
	maxValues: { width: number; height: number }
) =>
	({
		position: "absolute",
		top: `${styleMap.at(-1)?.dimensions.top! - rootDimensions.top}px`,
		left: `${styleMap.at(-1)?.dimensions.left! - rootDimensions.left}px`,
		height: `${maxValues.height}px`,
		width: `${maxValues.width}px`,
		pointerEvents: "none",
		overflow: "hidden",
	} as Partial<CSSStyleDeclaration>);

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

interface CalculateImageAnimationProps {
	key: ElementKey;
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
	const { key, element, styleState, context, calculateEasing } = props;

	const styleMap = styleState.getElementProperties(key)!;
	const maxDimensions = getMaximumDimensions(styleMap);

	const elementStyle = element.style.cssText;
	const parentElement = element.parentElement;
	const placeholderImage = getPlaceholderElement(element);
	const wrapper = getWrapperElement(
		getWrapperStyle(styleMap, styleState.getRootDimensions(), maxDimensions)
	);

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
		beforeImageCallback: () => {
			const nextSibling = element.nextElementSibling;

			nextSibling
				? parentElement?.insertBefore(placeholderImage, nextSibling)
				: parentElement?.appendChild(placeholderImage);

			element.style.cssText = `all: initial; height: ${maxDimensions.height}px; width: ${maxDimensions.width}px; pointer-events: none;`;

			wrapper.appendChild(element);
			document.body.appendChild(wrapper);
		},
		afterImageCallback: () => {
			try {
				parentElement?.replaceChild(element, placeholderImage);
			} catch (error) {
				placeholderImage.remove();
			}

			element.style.cssText = elementStyle;
			wrapper.remove();
		},
	};
};
