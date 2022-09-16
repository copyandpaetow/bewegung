import { defaultOptions } from "../constants";
import {
	calculatedElementProperties,
	ChunkOption,
	Chunks,
	Context,
	differenceArray,
	DimensionalDifferences,
	ElementKey,
	PreAnimation,
} from "../types";
import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { calculateEasingMap } from "./calculate-easings";
import { calculateOverwriteStyles } from "./overwrites";
import { isEntryVisible } from "./post-process";

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

export const calculateBorderRadius = (
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

	calculatedProperties.forEach((style) => {
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
	calculatedProperties: calculatedElementProperties[]
): Record<number, string> | undefined => {
	if (
		calculatedProperties.every(
			(style) => style.computedStyle.transform === "none"
		)
	) {
		return;
	}

	const styleTable: Record<number, string> = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.transform!)
	);

	return styleTable;
};

const calculateAdditionalKeyframeTables = (
	elementProperties: calculatedElementProperties[]
) => {
	return {
		borderRadiusTable: getBorderRadius(elementProperties),
		opacityTable: getOpacity(elementProperties),
		filterTable: getFilter(elementProperties),
		userTransformTable: getUserTransforms(elementProperties),
	};
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

const getTransformValues = (
	styleMap: calculatedElementProperties[],
	parentStyleMap: calculatedElementProperties[],
	isTextNode: boolean
): DimensionalDifferences[] => {
	return styleMap.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentStyleMap[index],
			parentStyleMap.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const getElementAnimations = (
	elementProperties: Map<string, calculatedElementProperties[]>,
	elementState: Map<string, ElementKey>,
	chunkState: Map<string, Chunks>,
	context: Context
): Map<string, PreAnimation> => {
	const animationMap = new Map<string, PreAnimation>();

	elementState.forEach((elementKey, idString) => {
		if (elementKey.tagName === "IMG") {
			return;
		}

		const allOptions: ChunkOption[] = [];

		elementKey.dependsOn.forEach((chunkId) => {
			allOptions.push(chunkState.get(chunkId)!.options);
		});
		const styleMap = elementProperties.get(idString)!;
		const parentStyleMap =
			elementProperties.get(elementKey.parent) ??
			elementProperties.get(elementKey.root)!;

		const easings = calculateEasingMap(allOptions, context.totalRuntime);
		const additionalTables = calculateAdditionalKeyframeTables(styleMap);
		const overwrite = calculateOverwriteStyles(styleMap, elementKey);

		const keyframes = constructKeyframes(
			getTransformValues(styleMap, parentStyleMap, elementKey.isTextNode),
			{
				easingTable: easings,
				...additionalTables,
			}
		);

		animationMap.set(idString, {
			keyframes,
			options: context.totalRuntime,
			overwrite,
		});
	});

	return animationMap;
};
