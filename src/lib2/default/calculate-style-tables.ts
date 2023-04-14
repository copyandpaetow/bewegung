import { DefaultReadouts, StyleTables, WorkerState } from "../types";
import { calculateBorderRadius } from "./border-radius";

export const getBorderRadius = (calculatedProperties: DefaultReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.borderRadius === "0px")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = calculateBorderRadius(style);
	});
	return styleTable;
};

export const getOpacity = (calculatedProperties: DefaultReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.opacity === "1")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.opacity!));
	return styleTable;
};

export const getFilter = (calculatedProperties: DefaultReadouts[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.filter === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.filter!));
	return styleTable;
};

export const getUserTransforms = (calculatedProperties: DefaultReadouts[]) => {
	const styleTable: Record<number, string> = {};
	if (calculatedProperties.every((style) => style.transform === "none")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => (styleTable[style.offset] = style.transform!));
	return styleTable;
};

const calculateKeyframeTables = (
	elementReadouts: DefaultReadouts[],
	easings: Record<number, string>
): StyleTables => ({
	borderRadiusTable: getBorderRadius(elementReadouts),
	opacityTable: getOpacity(elementReadouts),
	filterTable: getFilter(elementReadouts),
	userTransformTable: getUserTransforms(elementReadouts),
	easingTable: easings,
});

export const calculateStyleTables = (state: WorkerState) => {
	const { defaultReadouts, textReadouts, easings } = state;
	const styleTableMap = new Map<string, StyleTables>();
	defaultReadouts.forEach((elementReadouts, elementID) => {
		styleTableMap.set(elementID, calculateKeyframeTables(elementReadouts, easings.get(elementID)!));
	});
	textReadouts.forEach((elementReadouts, elementID) => {
		styleTableMap.set(elementID, calculateKeyframeTables(elementReadouts, easings.get(elementID)!));
	});

	return styleTableMap;
};
