import { emptyImageSrc } from "../constants";
import { scheduleCallback } from "../scheduler";
import { AnimationState, MaximumDimensions, State } from "../types";
import { applyStyleObject } from "./apply-styles";
import { calculateEasingMap } from "./calculate-easings";
import {
	calculateImageKeyframes,
	getMaximumDimensions,
	getWrapperKeyframes,
	getWrapperStyle,
} from "./calculate-image-keyframes";

const getPlaceholderElement = (imageState: ImageState) => {
	const { element } = imageState;
	const placeholder = document.createElement("img");

	element.getAttributeNames().forEach((attribute) => {
		placeholder.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholder.src = emptyImageSrc;
	placeholder.style.opacity = "0";

	imageState.placeholder = placeholder;
};

const getWrapperElement = (imageState: ImageState, wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyStyleObject(wrapper, wrapperStyle);
	imageState.wrapper = wrapper;
};

export interface ImageState {
	element: HTMLImageElement;
	originalStyle: string;
	parent: HTMLElement;
	sibling: Element | null;
	ratio: number;
	wrapper: HTMLElement;
	placeholder: HTMLImageElement;
	maxWidth: number;
	maxHeight: number;
	easingTable: Record<number, string>;
	wrapperKeyframes: Keyframe[];
	keyframes: Keyframe[];
}

const initialImageState = (element: HTMLImageElement): ImageState => ({
	element,
	originalStyle: element.style.cssText,
	parent: element.parentElement!,
	sibling: element.nextElementSibling,
	ratio: element.naturalWidth / element.naturalHeight,
	wrapper: element,
	placeholder: element,
	maxWidth: 0,
	maxHeight: 0,
	easingTable: {},
	wrapperKeyframes: [],
	keyframes: [],
});

const getBeforeCallback = (
	imageState: ImageState,
	beforeCallbacks: WeakMap<HTMLElement, VoidFunction[]>
) => {
	const { element, parent, sibling, maxHeight, maxWidth, wrapper, placeholder } = imageState;
	beforeCallbacks.set(
		element,
		(beforeCallbacks.get(element) ?? []).concat(() => {
			sibling ? parent.insertBefore(placeholder, sibling) : parent.appendChild(placeholder);

			element.style.cssText = `all: initial; height: ${maxHeight}px; width: ${maxWidth}px; pointer-events: none;`;

			wrapper.appendChild(element);
			document.body.appendChild(wrapper);
		})
	);
};

const getAfterCallback = (
	imageState: ImageState,
	afterCallbacks: WeakMap<HTMLElement, VoidFunction[]>
) => {
	const { element, parent, originalStyle, wrapper, placeholder } = imageState;
	afterCallbacks.set(wrapper, [
		() => {
			try {
				parent.replaceChild(element, placeholder);
			} catch (error) {
				placeholder.remove();
			}

			element.style.cssText = originalStyle;
			wrapper.remove();
		},
	]);
};

const createImageAnimations = (
	animations: Map<HTMLElement, Animation>,
	imageState: ImageState,
	totalRuntime: number
) => {
	const { element, wrapper, wrapperKeyframes, keyframes } = imageState;

	animations.set(element, new Animation(new KeyframeEffect(element, keyframes, totalRuntime)));
	animations.set(
		wrapper,
		new Animation(new KeyframeEffect(wrapper, wrapperKeyframes, totalRuntime))
	);
};

export const setImageCalculations = (animationState: AnimationState, state: State) => {
	const { animations, totalRuntime, rootElement, options } = state;
	const { imageReadouts, readouts, afterCallbacks, beforeCallbacks } = animationState;

	imageReadouts.forEach((readout, element) => {
		const imageState = initialImageState(element);
		const rootReadout = (readouts.get(rootElement.get(element)!) ||
			imageReadouts.get(rootElement.get(element)! as HTMLImageElement))!;

		const tasks = [
			() => getPlaceholderElement(imageState),
			() => getMaximumDimensions(imageState, readout),
			() => getWrapperElement(imageState, getWrapperStyle(imageState, readout, rootReadout)),
			() => calculateEasingMap(imageState, options.get(element)!, totalRuntime),
			() => getWrapperKeyframes(imageState, readout),
			() => calculateImageKeyframes(imageState, readout),
			() => createImageAnimations(animations, imageState, totalRuntime),
			() => getBeforeCallback(imageState, beforeCallbacks),
			() => getAfterCallback(imageState, afterCallbacks),
		];

		tasks.forEach(scheduleCallback);
	});
};
