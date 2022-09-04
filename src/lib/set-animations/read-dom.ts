import {
	calculatedElementProperties,
	ChunkState,
	Context,
	DomChanges,
	ElementKey,
	ElementState,
} from "../types";
import { getComputedStylings, getDomRect } from "./read-element-properties";

interface StyleChangePossibilities {
	attributes: string[];
	classes: string[];
	style: Partial<CSSStyleDeclaration>;
}

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
	chunkState: ChunkState,
	elementState: ElementState,
	context: Context
): DomChanges => {
	const originalStyle = new WeakMap<ElementKey, Map<string, string>>();
	const elementProperties = new WeakMap<
		ElementKey,
		calculatedElementProperties[]
	>();
	const { changeTimings, changeProperties } = context;
	let rootDimensions!: DOMRect;

	changeTimings.forEach((timing, index, array) => {
		if (index === 0) {
			elementState.getMainKeys().forEach((key) => {
				originalStyle.set(
					key,
					saveOriginalStyle(elementState.getDomElement(key))
				);
			});
		}

		elementState
			.getMainKeys()
			.forEach((key) =>
				applyCSSStyles(
					elementState.getDomElement(key),
					filterMatchingStyleFromKeyframes(
						chunkState.getKeyframes(key)!,
						timing
					)
				)
			);
		elementState.getAllKeys().forEach((key) => {
			const domElement = elementState.getDomElement(key);
			const newCalculation: calculatedElementProperties = {
				dimensions: getDomRect(domElement),
				offset: timing,
				computedStyle: getComputedStylings(changeProperties, domElement),
			};
			elementProperties.set(
				key,
				(elementProperties.get(key) || []).concat(newCalculation)
			);
		});
		if (index === array.length - 1) {
			elementState.getMainKeys().forEach((key) => {
				restoreOriginalStyle(
					elementState.getDomElement(key),
					originalStyle.get(key)!
				);
			});
			rootDimensions = getDomRect(document.body);
		}
	});

	return {
		originalStyle,
		elementProperties,
		elementState,
		chunkState,
		rootDimensions,
	};
};
