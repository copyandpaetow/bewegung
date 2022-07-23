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
} from "../prepare/prepare";
import { calculateEasingMap } from "./calculate-timeline";

const getBorderRadius = (
	element: HTMLElement
): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;

	if (styleMap.every((style) => style.computedStyle.borderRadius === "0px")) {
		return false;
	}

	const borderRadiusTable = {};

	styleMap.forEach(
		(style) =>
			//@ts-expect-error indexing
			(borderRadiusTable[style.offset] = style.computedStyle.borderRadius)
	);

	return borderRadiusTable;
};

const getOpacity = (element: HTMLElement): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	if (styleMap.every((style) => style.computedStyle.opacity === "1")) {
		return false;
	}

	const opacityTable = {};

	styleMap.forEach(
		//@ts-expect-error indexing
		(style) => (opacityTable[style.offset] = style.computedStyle.opacity)
	);

	return opacityTable;
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

export const getKeyframes = (element: HTMLElement): Keyframe[] => {
	const { totalRuntime } = state_context;
	const easingTable = calculateEasingMap(
		state_mainElements.has(element)
			? getOptions(element)
			: getDependecyOptions(element),
		totalRuntime
	);
	const borderRadiusTable = getBorderRadius(element);
	const opacityTable = getOpacity(element);
	const keyframes = getTransformValues(element).map(
		({ xDifference, yDifference, widthDifference, heightDifference, offset }) =>
			({
				offset,
				composite: "auto",
				easing: easingTable[offset] ?? defaultOptions.easing,
				transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				...(borderRadiusTable && {
					clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
				}),
				...(opacityTable && {
					opacity: `${opacityTable[offset]}`,
				}),
			} as Keyframe)
	);
	return keyframes;
};
