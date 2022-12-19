import { BewegungsOptions, ElementReadouts, StyleTables } from "../types";
import { calculateEasingMap } from "./calculate-easings";
import { isEntryVisible } from "./filter-readouts";

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

	if (radius.includes("/")) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return normalizeBorderRadius(radius, {
		width: externalWidth ?? styleEntry.dimensions.width,
		height: externalHeight ?? styleEntry.dimensions.height,
	});
};

export const getBorderRadius = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.computedStyle.borderRadius === "0px")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = isEntryVisible(style) ? calculateBorderRadius(style) : "0px";
	});
	return styleTable;
};

export const getOpacity = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.computedStyle.opacity === "1")) {
		return styleTable;
	}

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.opacity!)
	);
	return styleTable;
};

export const getFilter = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.computedStyle.filter === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.computedStyle.filter!));
	return styleTable;
};

export const getUserTransforms = (calculatedProperties: ElementReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.computedStyle.transform === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.transform!)
	);
	return styleTable;
};

export const calculateKeyframeTables = (
	elementReadouts: ElementReadouts[],
	easings: BewegungsOptions[],
	totalRoundtime: number
): StyleTables => ({
	borderRadiusTable: getBorderRadius(elementReadouts),
	opacityTable: getOpacity(elementReadouts),
	filterTable: getFilter(elementReadouts),
	userTransformTable: getUserTransforms(elementReadouts),
	easingTable: calculateEasingMap(easings, totalRoundtime),
});
