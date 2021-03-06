import {
	state_elementProperties,
	getTransformValues,
} from "../calculate/calculate";
import { defaultOptions } from "../constants";
import {
	state_dependencyElements,
	getOptions,
	state_context,
	state_mainElements,
	getKeyframes,
} from "../prepare/prepare";
import { calculateEasingMap } from "./calculate-timeline";

const getBorderRadius = (
	element: HTMLElement
): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;

	if (styleMap.every((style) => style.computedStyle.borderRadius === "0px")) {
		return false;
	}

	const styleTable = {};

	styleMap.forEach(
		(style) =>
			//@ts-expect-error indexing
			(styleTable[style.offset] = style.computedStyle.borderRadius)
	);

	return styleTable;
};

const getOpacity = (element: HTMLElement): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	if (styleMap.every((style) => style.computedStyle.opacity === "1")) {
		return false;
	}

	const styleTable = {};

	styleMap.forEach(
		//@ts-expect-error indexing
		(style) => (styleTable[style.offset] = style.computedStyle.opacity)
	);

	return styleTable;
};

const getFilter = (element: HTMLElement): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	if (styleMap.every((style) => style.computedStyle.filter === "none")) {
		return false;
	}

	const styleTable = {};

	styleMap.forEach(
		//@ts-expect-error indexing
		(style) => (styleTable[style.offset] = style.computedStyle.filter)
	);

	return styleTable;
};

const getUserTransforms = (
	element: HTMLElement
): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	const { changeTimings } = state_context;

	const styleTable = {};

	if (element.style.transform) {
		changeTimings.forEach((timing) => {
			//@ts-expect-error indexing
			styleTable[timing] = element.style.transform;
		});
	}

	state_mainElements.has(element)
		? getKeyframes(element).forEach((style) => {
				if (!style.transform) {
					return;
				}
				//@ts-expect-error indexing
				styleTable[style.offset] = style.transform;
		  })
		: styleMap.forEach((style) => {
				if (!style.computedStyle.transform) {
					return;
				}
				//@ts-expect-error indexing
				styleTable[style.offset] = style.computedStyle.transform;
		  });

	if (
		Object.values(styleTable).every(
			(style) => !Boolean(style) || style === "none"
		)
	) {
		return false;
	}
	return styleTable;
};

const getDependecyOptions = (element: HTMLElement): ComputedEffectTiming[] => {
	const options = new Set<ComputedEffectTiming>();

	state_dependencyElements
		.get(element)!
		.forEach((element) =>
			getOptions(element).forEach((option) => options.add(option))
		);

	return [...options];
};

export const constructKeyframes = (element: HTMLElement): Keyframe[] => {
	const { totalRuntime } = state_context;
	const easingTable = calculateEasingMap(
		state_mainElements.has(element)
			? getOptions(element)
			: getDependecyOptions(element),
		totalRuntime
	);

	const borderRadiusTable = getBorderRadius(element);
	const opacityTable = getOpacity(element);
	const userTransformTable = getUserTransforms(element);
	const filterTable = getFilter(element);

	console.log({ element, userTransformTable });

	const keyframes = getTransformValues(element).map(
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
	return keyframes;
};
