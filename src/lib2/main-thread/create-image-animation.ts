import { defaultImageStyles, emptyImageSrc } from "../shared/constants";
import { ImageState, MainState } from "../types";
import { fillImplicitKeyframes } from "../worker-thread/normalize-keyframes";
import { applyStyleObject } from "./apply-styles";

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
	state: MainState,
	totalRuntime: number
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];
	const { elementTranslation, elementRoots } = state;

	imageKeyframes.forEach((imageEntry, elementString) => {
		const { wrapperKeyframes, wrapperStyle, placeholderStyle, keyframes, override } = imageEntry;
		const domElement = elementTranslation.get(elementString) as HTMLImageElement;
		const originalStyle = domElement.style.cssText;

		const animation = new Animation(
			new KeyframeEffect(domElement, fillImplicitKeyframes(keyframes), totalRuntime)
		);
		const placeholder = getPlaceholderElement(domElement, placeholderStyle);
		const wrapper = getWrapperElement(wrapperStyle);
		const root = elementRoots.get(domElement)!;
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
