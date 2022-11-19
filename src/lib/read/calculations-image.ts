import { emptyImageSrc } from "../constants";
import { initialImageState } from "../initial-states";
import { scheduleCallback } from "../scheduler";
import { AnimationState, ElementReadouts, ImageState, State } from "../types";
import { applyStyleObject } from "./apply-styles";
import { calculateEasingMap } from "./easings";
import {
	calculateImageKeyframes,
	getMaximumDimensions,
	getWrapperKeyframes,
	getWrapperStyle,
} from "./image-keyframes";

const getPlaceholderElement = (imageState: ImageState, readouts: ElementReadouts[]) => {
	const { element } = imageState;
	const placeholder = document.createElement("img");

	element.getAttributeNames().forEach((attribute) => {
		placeholder.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholder.src = emptyImageSrc;
	placeholder.style.opacity = "0";
	placeholder.style.height = readouts.at(-1)!.dimensions.height + "px";
	placeholder.style.width = readouts.at(-1)!.dimensions.width + "px";

	imageState.placeholder = placeholder;
};

const getWrapperElement = (imageState: ImageState, wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyStyleObject(wrapper, wrapperStyle);
	imageState.wrapper = wrapper;
};

const setOnStartCallbacks = (
	onStart: WeakMap<HTMLElement, VoidFunction[]>,
	imageState: ImageState,
	rootElement: WeakMap<HTMLElement, HTMLElement>
) => {
	const { element, parent, sibling, maxHeight, maxWidth, wrapper, placeholder } = imageState;

	onStart.set(
		element,
		(onStart.get(element) ?? []).concat(() => {
			sibling ? parent.insertBefore(placeholder, sibling) : parent.appendChild(placeholder);

			element.style.cssText = `all: initial; height: ${maxHeight}px; width: ${maxWidth}px; pointer-events: none;`;

			wrapper.appendChild(element);
			rootElement.get(element)!.appendChild(wrapper);
		})
	);
};

const setOnEndCallbacks = (onEnd: WeakMap<HTMLElement, VoidFunction[]>, imageState: ImageState) => {
	const { element, parent, originalStyle, wrapper, placeholder } = imageState;
	onEnd.set(wrapper, [
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
	const { animations, totalRuntime, rootElement, options, onEnd, onStart } = state;
	const { imageReadouts, readouts } = animationState;

	imageReadouts.forEach((readout, element) => {
		const imageState = initialImageState(element);
		const rootReadout = (readouts.get(rootElement.get(element)!) ||
			imageReadouts.get(rootElement.get(element)! as HTMLImageElement))!;

		const tasks = [
			() => getPlaceholderElement(imageState, readout),
			() => getMaximumDimensions(imageState, readout),
			() => getWrapperElement(imageState, getWrapperStyle(imageState, readout, rootReadout)),
			() => calculateEasingMap(imageState, options.get(element)!, totalRuntime),
			() => getWrapperKeyframes(imageState, readout, rootReadout),
			() => calculateImageKeyframes(imageState, readout),
			() => createImageAnimations(animations, imageState, totalRuntime),
			() => setOnStartCallbacks(onStart, imageState, rootElement),
			() => setOnEndCallbacks(onEnd, imageState),
		];

		tasks.forEach(scheduleCallback);
	});
};
