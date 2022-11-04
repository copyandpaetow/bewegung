import { CalculationState, ElementReadouts } from "../types";
import { isEntryVisible } from "./update-calculations";

const normalizeBorderRadius = (radii: string, dimensions: { height: number; width: number }) => {
	const radius = radii.split(" ");
	const widthEntries: string[] = [];
	const heightEntries: string[] = [];

	if (radius.length === 3) {
		radius.push(radius[1]);
	}

	radius.forEach((value) => {
		if (value.includes("%") || value === "0px") {
			widthEntries.push(value);
			heightEntries.push(value);
			return;
		}
		const parsedValue = parseFloat(value);
		widthEntries.push(`${(100 * parsedValue) / dimensions.width}%`);
		heightEntries.push(`${(100 * parsedValue) / dimensions.height}%`);
	});

	return `${widthEntries.join(" ")} / ${heightEntries.join(" ")}`;
};

export const calculateBorderRadius = (
	styleEntry: ElementReadouts,
	externalWidth?: number,
	externalHeight?: number
): string => {
	const radius = styleEntry.computedStyle.borderRadius!;
	const normalized = normalizeBorderRadius(radius, {
		width: externalWidth ?? styleEntry.dimensions.width,
		height: externalHeight ?? styleEntry.dimensions.height,
	});

	if (radius.includes("/")) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return normalized;
};

export const getBorderRadius = (
	styleTable: Record<number, string>,
	calculatedProperties: ElementReadouts[]
) => {
	if (calculatedProperties.every((style) => style.computedStyle.borderRadius === "0px")) {
		return;
	}

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = isEntryVisible(style) ? calculateBorderRadius(style) : "0px";
	});
};

export const getOpacity = (
	styleTable: Record<number, string>,
	calculatedProperties: ElementReadouts[]
) => {
	if (calculatedProperties.every((style) => style.computedStyle.opacity === "1")) {
		return;
	}

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.opacity!)
	);
};

export const getFilter = (
	styleTable: Record<number, string>,
	calculatedProperties: ElementReadouts[]
) => {
	if (calculatedProperties.every((style) => style.computedStyle.filter === "none")) {
		return;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.computedStyle.filter!));
};

export const getUserTransforms = (
	styleTable: Record<number, string>,
	calculatedProperties: ElementReadouts[]
) => {
	if (calculatedProperties.every((style) => style.computedStyle.transform === "none")) {
		return;
	}

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.transform!)
	);
};

export const calculateAdditionalKeyframeTables = (
	calculationState: CalculationState,
	elementProperties: ElementReadouts[]
) => {
	const { borderRadiusTable, opacityTable, filterTable, userTransformTable } = calculationState;
	getBorderRadius(borderRadiusTable, elementProperties);
	getOpacity(opacityTable, elementProperties);
	getFilter(filterTable, elementProperties);
	getUserTransforms(userTransformTable, elementProperties);
};
