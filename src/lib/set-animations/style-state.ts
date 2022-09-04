import {
	calculatedElementProperties,
	DomStates,
	ElementKey,
	StyleState,
} from "../types";

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

export const getStyleState = ({
	originalStyle,
	elementProperties,
	elementStyleOverrides,
	rootDimensions,
}: DomStates): StyleState => {
	return {
		getOriginalStyle(key: ElementKey) {
			return originalStyle.get(key);
		},
		getElementProperties(key: ElementKey) {
			return elementProperties.get(key);
		},
		getStyleOverrides(key: ElementKey) {
			return elementStyleOverrides.get(key);
		},
		getRootDimensions() {
			return rootDimensions;
		},
	};
};
