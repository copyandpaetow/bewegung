import { emptyImageSrc } from "../constants";
import { restoreOriginalStyle } from "../normalize/css-resets";
import { applyStyleObject } from "../read/apply-styles";
import { ImageState, State, ElementEntry } from "../types";

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
	animationState: { animations: Animation[]; onStart: VoidFunction[] },
	state: State,
	entryLookup: Map<string, ElementEntry>,
	totalRuntime: number
) => {
	const { animations, onStart } = animationState;
	const { elementLookup, cssResets } = state;

	imageKeyframes.forEach((imageEntry, elementString) => {
		const {
			wrapperKeyframes,
			wrapperStyle,
			placeholderStyle,
			keyframes,
			maxHeight,
			maxWidth,
			overrides,
		} = imageEntry;
		const { animations, onStart } = animationState;
		const domElement = elementLookup.get(elementString) as HTMLImageElement;

		const animation = new Animation(new KeyframeEffect(domElement, keyframes, totalRuntime));
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
			restoreOriginalStyle(domElement, cssResets.get(elementString)!);
			applyStyleObject(domElement, overrides.after);
			applyStyleObject(root, { position: root.style.position });
		};

		onStart.push(() => {
			nextSibling ? parent.insertBefore(placeholder, nextSibling) : parent.appendChild(placeholder);

			domElement.style.cssText = `all: initial; height: ${maxHeight}px; width: ${maxWidth}px; pointer-events: none;`;

			wrapper.appendChild(domElement);
			root.appendChild(wrapper);

			applyStyleObject(domElement, overrides.before);
			applyStyleObject(root, { position: "relative" });
		});

		animations.push(animation);
		animations.push(new Animation(new KeyframeEffect(wrapper, wrapperKeyframes, totalRuntime)));
	});
};
