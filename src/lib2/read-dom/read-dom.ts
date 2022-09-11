import { BidirectionalMap } from "../inputs/bidirectional-map";
import {
	calculatedElementProperties,
	Context,
	CssRuleName,
	MinimalChunks,
} from "../types";
import { getComputedStylings, getDomRect } from "./read-element-properties";

interface StyleChangePossibilities {
	attributes: string[];
	classes: string[];
	style: Partial<CSSStyleDeclaration>;
}

//DOM access
export const applyStyleObject = (
	element: HTMLElement,
	style: Partial<CSSStyleDeclaration>
) => Object.assign(element.style, style);

const applyClasses = (element: HTMLElement, classes: string[]) =>
	classes.forEach((classEntry) => element.classList.toggle(classEntry));

const applyAttributes = (element: HTMLElement, attributes: string[]) => {
	attributes.forEach((attribute) => {
		const [key, value] = attribute.split("=");

		if (value) {
			element.setAttribute(key, value);
			return;
		}

		element.hasAttribute(key)
			? element.removeAttribute(key)
			: element.setAttribute(key, "");
	});
};

export const applyCSSStyles = (
	element: HTMLElement,
	stylePossibilities: StyleChangePossibilities
) => {
	const { attributes, classes, style } = stylePossibilities;

	if (Object.values(style).length) {
		applyStyleObject(element, style);
	}

	if (classes.length) {
		applyClasses(element, classes);
	}

	if (attributes.length) {
		applyAttributes(element, attributes);
	}
};

export const filterMatchingStyleFromKeyframes = (
	keyframes: ComputedKeyframe[],
	timing?: number
): StyleChangePossibilities => {
	let resultingStyle: Partial<CSSStyleDeclaration> = {};
	const classes: string[] = [];
	const attributes: string[] = [];

	keyframes?.forEach((keyframe) => {
		if (timing !== undefined && timing !== keyframe.offset) {
			return;
		}

		const {
			offset,
			composite,
			computedOffset,
			easing,
			transform,
			class: cssClass,
			attribute,
			...styles
		} = keyframe;

		resultingStyle = {
			...resultingStyle,
			...(transform && {
				transform: transform as string,
			}),
			...styles,
		};

		if (Boolean(cssClass)) {
			classes.push(...(cssClass as string).split(" "));
		}
		if (Boolean(attribute)) {
			attributes.push(...(attribute as string).split(" "));
		}
	});

	return { style: resultingStyle, classes, attributes };
};

const saveOriginalStyle = (element: HTMLElement) => {
	const allAttributes = new Map<string, string>([["style", ""]]);
	element.getAttributeNames().forEach((attribute) => {
		allAttributes.set(attribute, element.getAttribute(attribute)!);
	});

	return allAttributes;
};

export const restoreOriginalStyle = (
	element: HTMLElement,
	savedAttributes: Map<string, string>
) => {
	const currentAttributes = new Set(element.getAttributeNames());

	savedAttributes.forEach((value, key) => {
		element.setAttribute(key, value);

		if (!currentAttributes.has(key)) {
			return;
		}
		currentAttributes.delete(key);
	});

	currentAttributes.forEach((attribute) => {
		element.removeAttribute(attribute);
	});
};

export const readDomChanges = (
	keyElementMap: BidirectionalMap<HTMLElement, string>,
	chunks: MinimalChunks[],
	context: Context
) => {
	const originalStyle = new WeakMap<HTMLElement, Map<string, string>>();
	const elementProperties = new Map<string, calculatedElementProperties[]>();
	const { changeTimings, changeProperties } = context;

	changeTimings.forEach((timing, index, array) => {
		if (index === 0) {
			chunks.forEach(({ target }) => {
				target.forEach((elementString) => {
					const element = keyElementMap.get(elementString)!;
					originalStyle.set(element, saveOriginalStyle(element));
				});
			});
		}

		chunks.forEach(({ target, keyframes }) => {
			target.forEach((elementString) => {
				const element = keyElementMap.get(elementString)!;
				applyCSSStyles(
					element,
					filterMatchingStyleFromKeyframes(keyframes, timing)
				);
			});
		});

		keyElementMap.forEach((elementString, element) => {
			const newCalculation: calculatedElementProperties = {
				dimensions: getDomRect(element),
				offset: timing,
				computedStyle: getComputedStylings(changeProperties, element),
				naturalRatio:
					element.tagName !== "img"
						? undefined
						: (element as HTMLImageElement).naturalWidth /
						  (element as HTMLImageElement).naturalHeight,
			};
			elementProperties.set(
				elementString,
				(elementProperties.get(elementString) || []).concat(newCalculation)
			);
		});

		if (index === array.length - 1) {
			chunks.forEach(({ target }) => {
				target.forEach((elementString) => {
					const element = keyElementMap.get(elementString)!;
					restoreOriginalStyle(element, originalStyle.get(element)!);
				});
			});
		}
	});

	return elementProperties;
};
