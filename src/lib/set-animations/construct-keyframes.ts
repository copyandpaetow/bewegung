import { defaultOptions } from "../constants";
import {
	calculatedElementProperties,
	ChunkState,
	DimensionalDifferences,
	ElementState,
} from "../types";
import { isEntryVisible } from "./postprocess-element-properties";

/*
	diagonal values can be the same but this is mostly only for the top-right and bottom-left corner true: 5px 10px 2px => 5px 10px 2px 10px
*/

const normalizeBorderRadius = (
	radii: string,
	dimensions: { height: number; width: number }
) => {
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

const calculateBorderRadius = (
	styleEntry: calculatedElementProperties
): string => {
	const radius = styleEntry.computedStyle.borderRadius!;
	const normalized = normalizeBorderRadius(radius, {
		width: styleEntry.dimensions.width,
		height: styleEntry.dimensions.height,
	});

	if (radius.includes("/")) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return normalized;
};

export const getBorderRadius = (
	calculatedProperties: calculatedElementProperties[]
): Record<number, string> | undefined => {
	if (
		calculatedProperties.every(
			(style) => style.computedStyle.borderRadius === "0px"
		)
	) {
		return;
	}

	const styleTable: Record<number, string> = {};

	calculatedProperties.forEach((style, index, array) => {
		styleTable[style.offset] = isEntryVisible(style)
			? calculateBorderRadius(style)
			: "0px";
	});

	return styleTable;
};

export const getOpacity = (
	calculatedProperties: calculatedElementProperties[]
): Record<number, string> | undefined => {
	if (
		calculatedProperties.every((style) => style.computedStyle.opacity === "1")
	) {
		return;
	}

	const styleTable: Record<number, string> = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.opacity!)
	);

	return styleTable;
};

export const getFilter = (
	calculatedProperties: calculatedElementProperties[]
): Record<number, string> | undefined => {
	if (
		calculatedProperties.every((style) => style.computedStyle.filter === "none")
	) {
		return;
	}

	const styleTable: Record<number, string> = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.filter!)
	);

	return styleTable;
};

export const getUserTransforms = (
	element: HTMLElement,
	changeTimings: number[],
	keyframes?: ComputedKeyframe[]
): Record<number, string> | undefined => {
	const styleTable: Record<number, string> = {};

	if (element.style.transform) {
		changeTimings.forEach((timing) => {
			styleTable[timing] = element.style.transform;
		});
	}

	keyframes?.forEach((style) => {
		if (!style.transform) {
			return;
		}
		styleTable[style.offset as number] = style.transform as string;
	});

	if (
		Object.values(styleTable).every(
			(style) => !Boolean(style) || style === "none"
		)
	) {
		return;
	}
	return styleTable;
};

export const getDependecyOptions = (
	element: HTMLElement,
	elementState: ElementState,
	chunkState: ChunkState
): ComputedEffectTiming[] => {
	const options = new Set<ComputedEffectTiming>();

	elementState.getDependecyElements(element)?.forEach((dependencyElement) => {
		chunkState
			.getOptions(dependencyElement)
			?.forEach((option) => options.add(option));
	});
	return [...options];
};

interface StyleTables {
	easingTable: Record<number, string>;
	borderRadiusTable?: Record<number, string>;
	opacityTable?: Record<number, string>;
	userTransformTable?: Record<number, string>;
	filterTable?: Record<number, string>;
}

export const constructKeyframes = (
	transformValues: DimensionalDifferences[],
	styleTables: StyleTables
): Keyframe[] => {
	const {
		easingTable,
		borderRadiusTable,
		opacityTable,
		userTransformTable,
		filterTable,
	} = styleTables;

	return transformValues.map(
		({ xDifference, yDifference, widthDifference, heightDifference, offset }) =>
			({
				offset,
				composite: "auto",
				easing: easingTable[offset] ?? defaultOptions.easing,
				transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference}) ${
					userTransformTable ? userTransformTable[offset] : ""
				} `,
				...(borderRadiusTable && {
					clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
				}),
				...(opacityTable && {
					opacity: `${opacityTable[offset]}`,
				}),
				...(filterTable && {
					filter: `${filterTable[offset]}`,
				}),
			} as Keyframe)
	);
};
