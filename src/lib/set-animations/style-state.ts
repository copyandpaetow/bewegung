import {
	calculatedElementProperties,
	DomChanges,
	DomStates,
	StyleState,
} from "../types";
import { recalculateDisplayNoneValues } from "./postprocess-element-properties";

export const addOverrideStyles = (
	elementProperties: calculatedElementProperties[],
	keyframes: ComputedKeyframe[],
	tagName: string
) => {
	const override: Partial<CSSStyleDeclaration> = {};
	const existingStyle: Partial<CSSStyleDeclaration> = {};

	elementProperties.some((entry) => {
		//TODO: this needs to be more advanced
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
		const properties = elementProperties.get(element)!;

		elementProperties.set(element, recalculateDisplayNoneValues(properties));

		const overrideStyle = addOverrideStyles(
			properties,
			chunkState.getKeyframes(element) ?? [],
			element.tagName
		);
		if (overrideStyle) {
			elementStyleOverrides.set(element, overrideStyle);
		}
	});

	return { originalStyle, elementProperties, elementStyleOverrides };
};

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
