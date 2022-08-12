import { applyCSSStyles, state_elementProperties } from "../read/read";
import { save } from "../read/differences";
import { state_context } from "../prepare/prepare";
import { emptyImageSrc } from "../constants";

export const state_image = new WeakMap<HTMLElement, () => VoidFunction>();

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

export const calculateNewImage = (
	element: HTMLImageElement,
	easingTable: Record<number, string>
): Animation[] => {
	const { totalRuntime } = state_context;
	const styleMap = state_elementProperties.get(element)!;

	const rootStyleMap = state_elementProperties.get(document.body);

	const wrapper = document.createElement("div");
	const placeholderImage = element.cloneNode() as HTMLImageElement;

	const maxHeight = styleMap.reduce((highest, current) => {
		return Math.max(highest, current.dimensions.height);
	}, 0);

	const maxWidth = styleMap.reduce((highest, current) => {
		return Math.max(highest, current.dimensions.width);
	}, 0);

	const { top: rootTop, left: rootLeft } = rootStyleMap?.at(-1)?.dimensions!;
	placeholderImage.src = false ? emptyImageSrc : element.src;
	placeholderImage.style.opacity = "0";

	const wrapperStyle: Partial<CSSStyleDeclaration> = {
		position: "absolute",
		top: `${styleMap.at(-1)?.dimensions.top! - rootTop}px`,
		left: `${styleMap.at(-1)?.dimensions.left! - rootLeft}px`,
		height: `${maxHeight}px`,
		width: `${maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
	};

	applyCSSStyles(wrapper, wrapperStyle);

	const wrapperKeyframes = styleMap.map((entry, _, array): Keyframe => {
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

	const originalImageRatio = element.naturalWidth / element.naturalHeight;

	const imageKeyframes = styleMap.map((entry): Keyframe => {
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

	state_image.set(element, () => {
		const nextSibling = element.nextElementSibling;
		const parent = element.parentElement;
		const styles = element.style.cssText;

		nextSibling
			? parent?.insertBefore(placeholderImage, nextSibling)
			: parent?.appendChild(placeholderImage);

		element.style.cssText = `all: initial; height: ${maxHeight}px; width: ${maxWidth}px; pointer-events: none;`;

		wrapper.appendChild(element);
		document.body.appendChild(wrapper);

		return () => {
			parent?.replaceChild(element, placeholderImage);
			element.style.cssText = styles;
			wrapper.remove();
		};
	});

	return [
		new Animation(new KeyframeEffect(wrapper, wrapperKeyframes, totalRuntime)),
		new Animation(new KeyframeEffect(element, imageKeyframes, totalRuntime)),
	];
};
