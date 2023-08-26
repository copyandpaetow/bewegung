import { TreeEntry } from "../types";

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
	styleEntry: TreeEntry,
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

export const getBorderRadius = (readouts: TreeEntry[]) => {
	const styleTable = new Map<number, string>();

	readouts.forEach((style, offset) => {
		if (style.borderRadius === "0px") {
			return;
		}
		styleTable.set(offset, calculateBorderRadius(style));
	});

	return styleTable;
};
