import { ElementState } from "../prepare/element-state";
import {
	calculatedElementProperties,
	cssRuleName,
	differenceArray,
	DimensionalDifferences,
} from "../types";
import {
	calculateDimensionDifferences,
	checkForTextNode,
	emptyCalculatedProperties,
} from "./differences";
import { getComputedStylings, getDomRect } from "./dimensions";
import { recalculateDisplayNoneValues } from "./postprocess";

export const addOverrideStyles = (
	elementProperties: calculatedElementProperties[],
	keyframes: ComputedKeyframe[],
	tagName: string
) => {
	const override: Partial<CSSStyleDeclaration> = {};
	const existingStyle: Partial<CSSStyleDeclaration> = {};

	elementProperties.some((entry) => {
		if (entry.computedStyle.display !== "inline" || tagName !== "SPAN") {
			return false;
		}
		existingStyle.display = (keyframes
			.filter((keyframe) => keyframe?.display)
			.at(-1) ?? "") as string;

		override.display = "inline-block";
		return true;
	});

	elementProperties.some((entry) => {
		if (entry.computedStyle.borderRadius === "0px") {
			return false;
		}

		existingStyle.borderRadius = (keyframes
			.filter((keyframe) => keyframe?.borderRadius)
			.at(-1) ?? "") as string;

		override.borderRadius = "0px";

		return true;
	});

	if (Object.keys(override).length === 0) {
		return;
	}
	return { existingStyle, override };
};

export const getTransformValues = (
	element: HTMLElement,
	styleState: StyleState,
	changeTimings: number[],
	changeProperties: cssRuleName[]
): DimensionalDifferences[] => {
	const parentEntries =
		styleState.getElementProperties(element.parentElement!) ??
		emptyCalculatedProperties(changeProperties, changeTimings);
	const elementProperties = styleState.getElementProperties(element)!;
	const isTextNode = checkForTextNode(element);

	return elementProperties.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentEntries[index],
			parentEntries.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const applyCSSStyles = (
	element: HTMLElement,
	style: Partial<CSSStyleDeclaration>
) => {
	if (Object.values(style).length === 0) {
		return false;
	}
	Object.assign(element.style, style);
	return true;
};

export const filterMatchingStyleFromKeyframes = (
	keyframes: ComputedKeyframe[],
	timing?: number
) => {
	let resultingStyle: Partial<CSSStyleDeclaration> = {};
	keyframes?.forEach((keyframe) => {
		if (timing !== undefined && timing !== keyframe.offset) {
			return;
		}

		const { offset, composite, computedOffset, easing, transform, ...styles } =
			keyframe;

		resultingStyle = {
			...resultingStyle,
			...(timing === undefined && {
				transform: transform as string | undefined,
			}),
			...styles,
		};
	});

	return resultingStyle;
};

interface DomChanges {
	originalStyle: WeakMap<HTMLElement, string>;
	elementProperties: WeakMap<HTMLElement, calculatedElementProperties[]>;
	elementState: ElementState;
	getKeyframes: (element: HTMLElement) => ComputedKeyframe[];
}

interface ReadDomChanges {
	elementState: ElementState;
	getKeyframes: (element: HTMLElement) => ComputedKeyframe[];
	changeTimings: number[];
	changeProperties: cssRuleName[];
}

export const readDomChanges = ({
	elementState,
	getKeyframes,
	changeTimings,
	changeProperties,
}: ReadDomChanges): DomChanges => {
	const originalStyle = new WeakMap<HTMLElement, string>();
	const elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
	>();

	changeTimings.forEach((timing, index, array) => {
		if (index === 0) {
			elementState.getMainElements().forEach((element) => {
				originalStyle.set(element, element.style.cssText);
			});
		}

		elementState
			.getMainElements()
			.forEach((element) =>
				applyCSSStyles(
					element,
					filterMatchingStyleFromKeyframes(getKeyframes(element), timing)
				)
			);
		elementState
			.getAllElements()
			.concat([document.body])
			.forEach((element) => {
				const newCalculation: calculatedElementProperties = {
					dimensions: getDomRect(element),
					offset: timing,
					computedStyle: getComputedStylings(changeProperties, element),
				};
				elementProperties.set(
					element,
					(elementProperties.get(element) || []).concat([newCalculation])
				);
			});
		if (index === array.length - 1) {
			elementState.getMainElements().forEach((element) => {
				element.style.cssText = originalStyle.get(element)!;
			});
		}
	});

	return {
		originalStyle,
		elementProperties,
		elementState,
		getKeyframes,
	};
};

interface DomStates {
	originalStyle: WeakMap<HTMLElement, string>;
	elementProperties: WeakMap<HTMLElement, calculatedElementProperties[]>;
	elementStyleOverrides: WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>;
}

export const postprocessProperties = ({
	originalStyle,
	elementProperties,
	elementState,
	getKeyframes,
}: DomChanges): DomStates => {
	const elementStyleOverrides = new WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();

	elementState.getAllElements().forEach((element) => {
		elementProperties.set(
			element,
			recalculateDisplayNoneValues(elementProperties.get(element)!)
		);
		const overrideStyle = addOverrideStyles(
			elementProperties.get(element)!,
			elementState.isMainElement(element) ? getKeyframes(element) : [],
			element.tagName
		);
		if (overrideStyle) {
			elementStyleOverrides.set(element, overrideStyle);
		}
	});

	return { originalStyle, elementProperties, elementStyleOverrides };
};

export interface StyleState {
	getOriginalStyle(element: HTMLElement): string | undefined;
	getElementProperties(
		element: HTMLElement
	): calculatedElementProperties[] | undefined;
	getStyleOverrides(element: HTMLElement):
		| {
				existingStyle: Partial<CSSStyleDeclaration>;
				override: Partial<CSSStyleDeclaration>;
		  }
		| undefined;
}

export const getStyleState = ({
	originalStyle,
	elementProperties,
	elementStyleOverrides,
}: DomStates): StyleState => {
	return {
		getOriginalStyle(element: HTMLElement) {
			return originalStyle.get(element);
		},
		getElementProperties(element: HTMLElement) {
			return elementProperties.get(element);
		},
		getStyleOverrides(element: HTMLElement) {
			return elementStyleOverrides.get(element);
		},
	};
};
