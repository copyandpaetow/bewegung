import { defaultImageStyles, emptyImageSrc } from "../constants";
import { applyStyleObject } from "./apply-styles";
import { ElementEntry, ImageState, State } from "../types";
import { fillImplicitKeyframes } from "./create-animations-from-keyframes";

const getPlaceholderElement = (element: HTMLImageElement, style: Partial<CSSStyleDeclaration>) => {
	const placeholder = document.createElement("img");

	element.getAttributeNames().forEach((attribute) => {
		placeholder.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholder.src = emptyImageSrc;
	applyStyleObject(element, style);

	return placeholder;
};

const getWrapperElement = (wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyStyleObject(wrapper, wrapperStyle);
	return wrapper;
};

export const createImageAnimation = (
	imageKeyframes: Map<string, ImageState>,
	state: State,
	entryLookup: Map<string, ElementEntry>,
	totalRuntime: number
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];
	const { elementLookup } = state;

	imageKeyframes.forEach((imageEntry, elementString) => {
		const { wrapperKeyframes, wrapperStyle, placeholderStyle, keyframes, override } = imageEntry;
		const domElement = elementLookup.get(elementString) as HTMLImageElement;
		const originalStyle = domElement.style.cssText;

		const animation = new Animation(
			new KeyframeEffect(domElement, fillImplicitKeyframes(keyframes), totalRuntime)
		);
		const placeholder = getPlaceholderElement(domElement, placeholderStyle);
		const wrapper = getWrapperElement(wrapperStyle);
		const entry = entryLookup.get(elementString)!;
		const root = elementLookup.get(entry.root)!;
		const nextSibling = domElement.nextElementSibling;
		const parent = domElement.parentElement!;

		animation.onfinish = () => {
			try {
				parent.replaceChild(domElement, placeholder);
			} catch (error) {
				placeholder.remove();
			}
			wrapper.remove();
			domElement.style.cssText = originalStyle;
		};

		onStart.push(() => {
			nextSibling ? parent.insertBefore(placeholder, nextSibling) : parent.appendChild(placeholder);
			applyStyleObject(domElement, {
				...defaultImageStyles,
				...override,
				height: "100%",
				width: "100%",
			});
			wrapper.appendChild(domElement);
			root.appendChild(wrapper);
		});

		const wrapperAnimation = new Animation(
			new KeyframeEffect(wrapper, fillImplicitKeyframes(wrapperKeyframes), totalRuntime)
		);

		animations.push(animation, wrapperAnimation);
	});

	return { animations, onStart };
};
