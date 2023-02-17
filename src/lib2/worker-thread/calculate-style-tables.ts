import { BewegungsOptions, ElementReadouts, StyleTables } from "../types";
import { calculateEasingMap } from "./calculate-easings";

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
	const radius = styleEntry.borderRadius!;

	if (radius.includes("/")) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return normalizeBorderRadius(radius, {
		width: externalWidth ?? styleEntry.currentWidth,
		height: externalHeight ?? styleEntry.currentHeight,
	});
};

export const getBorderRadius = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.borderRadius === "0px")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = calculateBorderRadius(style);
	});
	return styleTable;
};

export const getOpacity = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.opacity === "1")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.opacity!));
	return styleTable;
};

export const getFilter = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.filter === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.filter!));
	return styleTable;
};

export const getUserTransforms = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.transform === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.transform!));
	return styleTable;
};

export const calculateKeyframeTables = (
	elementReadouts: ElementReadouts[],
	easings: Record<number, string>
): StyleTables => ({
	borderRadiusTable: getBorderRadius(elementReadouts),
	opacityTable: getOpacity(elementReadouts),
	filterTable: getFilter(elementReadouts),
	userTransformTable: getUserTransforms(elementReadouts),
	easingTable: easings,
});
