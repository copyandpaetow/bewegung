import { defaultOptions } from "./constants";
import { ChunkState } from "./get-chunk-state";
import { ElementState } from "./get-element-state";
import { calculatedElementProperties, DimensionalDifferences } from "./types";

const calculateBorderRadius = (
	styleEntry: calculatedElementProperties
): string => {
	const numHeight = parseFloat(styleEntry.computedStyle.height!);
	const numWidth = parseFloat(styleEntry.computedStyle.width!);
	const parsedRadius = parseFloat(styleEntry.computedStyle.borderRadius!);

	if (isNaN(parsedRadius)) {
		//TODO: handle more complex border radius
		return "0px";
	}

	return `${(100 * parsedRadius) / numWidth}% / ${
		(100 * parsedRadius) / numHeight
	}%`;
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

	const styleTable = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = calculateBorderRadius(style))
	);

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

	const styleTable = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.opacity)
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

	const styleTable = {};

	calculatedProperties.forEach(
		(style) => (styleTable[style.offset] = style.computedStyle.filter)
	);

	return styleTable;
};

export const getUserTransforms = (
	element: HTMLElement,
	changeTimings: number[],
	keyframes?: ComputedKeyframe[]
): Record<number, string> | undefined => {
	const styleTable = {};

	if (element.style.transform) {
		changeTimings.forEach((timing) => {
			styleTable[timing] = element.style.transform;
		});
	}

	keyframes?.forEach((style) => {
		if (!style.transform) {
			return;
		}

		styleTable[style.offset as number] = style.transform;
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
			.forEach((option) => options.add(option));
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
