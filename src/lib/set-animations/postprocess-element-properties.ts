import {
	calculatedElementProperties,
	DomChanges,
	DomStates,
	ElementKey,
} from "../types";
import { addOverrideStyles } from "./style-state";

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

export const postprocessProperties = ({
	originalStyle,
	elementProperties,
	elementState,
	chunkState,
}: DomChanges): DomStates => {
	const elementStyleOverrides = new WeakMap<
		ElementKey,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();

	elementState.getAllKeys().forEach((key) => {
		const properties = elementProperties.get(key)!;

		elementProperties.set(key, recalculateDisplayNoneValues(properties));

		const overrideStyle = addOverrideStyles(
			properties,
			chunkState.getKeyframes(key) ?? [],
			elementState.getDomElement(key).tagName
		);
		if (overrideStyle) {
			elementStyleOverrides.set(key, overrideStyle);
		}
	});

	return { originalStyle, elementProperties, elementStyleOverrides };
};
