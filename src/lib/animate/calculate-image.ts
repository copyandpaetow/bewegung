import { state_elementProperties } from "../read/read";
import { save } from "../read/differences";
import { state_context } from "../prepare/prepare";

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
	placeholderImage.src =
		"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
	//placeholderImage.src = element.src;

	wrapper.style.position = "absolute";
	wrapper.style.top = `${styleMap.at(-1)?.dimensions.top! - rootTop}px`;
	wrapper.style.left = `${styleMap.at(-1)?.dimensions.left! - rootLeft}px`;
	wrapper.style.height = `${maxHeight}px`;
	wrapper.style.width = `${maxWidth}px`;

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

		// if (element.classList.contains("test")) {
		// 	//console.log({ element, horizontalInset, verticalInset, translateX, translateY, deltaTop, deltaLeft });
		// }

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

	const imageKeyframes = styleMap.map((entry): Keyframe => {
		const scaleX = maxWidth / (maxWidth - entry.dimensions.width);
		const scaleY = maxHeight / (maxHeight - entry.dimensions.height);

		if (element.classList.contains("test")) {
			console.log({ element, scaleX, scaleY });
		}

		return {
			offset: entry.offset,
			//?these are currently off by 2% and 4%
			//transform: `scale(${save(scaleX, 1)}, ${save(scaleY, 1)})`,
			easing: easingTable[entry.offset] ?? "ease",
		};
	});

	if (
		element.classList.contains("test") ||
		element.classList.contains("additional__img")
	) {
		console.log({
			element,
			wrapperKeyframes,
			imageKeyframes,
			maxHeight,
			maxWidth,
			styleMap,
		});
	}

	state_image.set(element, () => {
		const nextSibling = element.nextElementSibling;
		const parent = element.parentElement;
		const styles = element.style.cssText;

		nextSibling
			? parent?.insertBefore(placeholderImage, nextSibling)
			: parent?.appendChild(placeholderImage);

		element.style.cssText = `all: initial; height: ${maxHeight}px; width: ${maxWidth}px`;
		//element.style.opacity = "0.5";

		// wrapper.dataset.clipPath = wrapperKeyframes.at(-1).clipPath;
		// wrapper.dataset.transform = wrapperKeyframes.at(-1).transform;

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
		//new Animation(new KeyframeEffect(element, imageKeyframes, totalRuntime)),
	];
};
