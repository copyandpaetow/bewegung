import {
	emptyCalculatedProperties,
	checkForTextNode,
	calculateDimensionDifferences,
} from "./calculate-dimension-differences";
import { ChunkState } from "./get-chunk-state";
import { ElementState } from "./get-element-state";
import { getDomRect, getComputedStylings } from "./read-element-properties";
import {
	calculatedElementProperties,
	Context,
	DimensionalDifferences,
	differenceArray,
} from "./types";
import { recalculateDisplayNoneValues } from "./postprocess-element-properties";

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
	context: Context
): DimensionalDifferences[] => {
	const { changeProperties, changeTimings } = context;
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
			...((timing === undefined || !transform) && {
				transform: transform as string,
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
	chunkState: ChunkState;
}

export const readDomChanges = (
	chunkState: ChunkState,
	elementState: ElementState,
	context: Context
): DomChanges => {
	const originalStyle = new WeakMap<HTMLElement, string>();
	const elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
	>();
	const { changeTimings, changeProperties } = context;

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
					filterMatchingStyleFromKeyframes(
						chunkState.getKeyframes(element),
						timing
					)
				)
			);
		elementState
			.getAllElements()
			.concat(document.body)
			.forEach((element) => {
				const newCalculation: calculatedElementProperties = {
					dimensions: getDomRect(element),
					offset: timing,
					computedStyle: getComputedStylings(changeProperties, element),
				};
				elementProperties.set(
					element,
					(elementProperties.get(element) || []).concat(newCalculation)
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
		chunkState,
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
	chunkState,
}: DomChanges): DomStates => {
	const elementStyleOverrides = new WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();

	elementState.getAllElements().forEach((element) => {
		const updatedProperties = recalculateDisplayNoneValues(
			elementProperties.get(element)!
		);

		if (updatedProperties) {
			elementProperties.set(element, updatedProperties);
		}

		const overrideStyle = addOverrideStyles(
			elementProperties.get(element)!,
			elementState.isMainElement(element)
				? chunkState.getKeyframes(element)
				: [],
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
