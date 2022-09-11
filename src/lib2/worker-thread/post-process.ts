const addOverrideStyles = (
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

import { calculatedElementProperties } from "../types";

export const isEntryVisible = (entry: calculatedElementProperties) =>
	entry.computedStyle.display !== "none" &&
	entry.dimensions.height !== 0 &&
	entry.dimensions.width !== 0;

export const recalculateDisplayNoneValues = (
	elementProperties: calculatedElementProperties[]
): calculatedElementProperties[] => {
	if (elementProperties.every(isEntryVisible)) {
		return elementProperties;
	}

	return elementProperties.map((entry, index, array) => {
		if (isEntryVisible(entry)) {
			return entry;
		}
		const nextEntryDimensions = (
			array.slice(0, index).reverse().find(isEntryVisible) ||
			array.slice(index).find(isEntryVisible)
		)?.dimensions;

		if (!nextEntryDimensions) {
			return entry;
		}

		return {
			...entry,
			dimensions: { ...nextEntryDimensions, width: 0, height: 0 },
		};
	});
};

export const postprocessProperties = (
	elementProperties: Map<string, calculatedElementProperties[]>
) => {
	const elementStyleOverrides = new WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();

	const postprocessedProperties = new Map<
		string,
		calculatedElementProperties[]
	>();

	elementProperties.forEach((properties, elementString) => {
		postprocessedProperties.set(
			elementString,
			recalculateDisplayNoneValues(properties)
		);
	});

	return postprocessedProperties;
};
