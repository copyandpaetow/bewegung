import { emptyImageSrc } from "../constants";
import { BidirectionalMap } from "../inputs/bidirectional-map";
import { applyStyleObject, restoreOriginalStyle } from "../read-dom/read-dom";
import { ElementKey, PreAnimation } from "../types";

const getWrapperElement = (wrapperStyle: Partial<CSSStyleDeclaration>) => {
	const wrapper = document.createElement("div");
	applyStyleObject(wrapper, wrapperStyle);
	return wrapper;
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

export const assembleImageAnimations = (
	elementKeyMap: BidirectionalMap<HTMLElement, string>,
	keyedElementMap: Map<string, ElementKey>,
	imageAnimationMap: Map<
		string,
		{
			wrapper: PreAnimation;
			image: PreAnimation;
		}
	>,
	originalStyleMap: WeakMap<HTMLElement, Map<string, string>>
) => {
	const animations: Animation[] = [];
	const callbacks: { before: VoidFunction[]; after: VoidFunction[] } = {
		before: [],
		after: [],
	};

	imageAnimationMap.forEach((animationValues, idString) => {
		const imageElement = elementKeyMap.get(idString) as HTMLImageElement;
		const parentElement = elementKeyMap.get(
			keyedElementMap.get(idString)!.parent
		);
		const { wrapper, image } = animationValues;

		const wrapperElement = getWrapperElement(wrapper.overwrite);
		const placeholderElement = getPlaceholderElement(imageElement);

		const wrapperAnimation = new Animation(
			new KeyframeEffect(wrapperElement, wrapper.keyframes, wrapper.options)
		);
		const ImageAnimation = new Animation(
			new KeyframeEffect(imageElement, image.keyframes, image.options)
		);
		animations.push(wrapperAnimation, ImageAnimation);

		callbacks.before.push(() => {
			const nextSibling = imageElement.nextElementSibling;
			nextSibling
				? parentElement?.insertBefore(placeholderElement, nextSibling)
				: parentElement?.appendChild(placeholderElement);

			applyStyleObject(imageElement, image.overwrite);

			wrapperElement.appendChild(imageElement);
			elementKeyMap
				.get(keyedElementMap.get(idString)!.root)!
				.appendChild(wrapperElement);
		});

		callbacks.after.push(() => {
			try {
				parentElement?.replaceChild(imageElement, placeholderElement);
			} catch (error) {
				placeholderElement.remove();
			}
			wrapperElement.remove();
			restoreOriginalStyle(imageElement, originalStyleMap.get(imageElement)!);
		});
	});

	return { animations, callbacks };
};
