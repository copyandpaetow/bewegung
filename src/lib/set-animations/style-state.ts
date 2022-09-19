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
	keyElementMap,
	elementState,
	chunkState,
}: DomChanges): DomStates => {
	const elementStyleOverrides = new Map<
		string,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();

	keyElementMap.forEach((stringId) => {
		const properties = elementProperties.get(stringId)!;
		elementProperties.set(stringId, recalculateDisplayNoneValues(properties));

		const elementKey = elementState.get(stringId)!;
		const allKeyframes: ComputedKeyframe[] = [];
		elementKey.dependsOn.forEach((chunkId) => {
			allKeyframes.push(...chunkState.get(chunkId)?.keyframes!);
		});

		const overrideStyle = addOverrideStyles(
			properties,
			allKeyframes,
			elementKey.tagName
		);
		if (overrideStyle) {
			elementStyleOverrides.set(stringId, overrideStyle);
		}
	});

	return {
		originalStyle,
		elementProperties,
		elementStyleOverrides,
	};
};

export const getStyleState = ({
	originalStyle,
	elementProperties,
	elementStyleOverrides,
}: DomStates): StyleState => {
	return {
		getOriginalStyle(stringId: string) {
			return originalStyle.get(stringId);
		},
		getElementProperties(stringId: string) {
			return elementProperties.get(stringId);
		},
		getStyleOverrides(stringId: string) {
			return elementStyleOverrides.get(stringId);
		},
	};
};
