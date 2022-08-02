import { state_elementProperties, getTransformValues } from "../read/read";
import { defaultOptions } from "../constants";
import {
	state_dependencyElements,
	getOptions,
	state_context,
	state_mainElements,
	getKeyframes,
} from "../prepare/prepare";
import { calculatedElementProperties } from "../types";
import { calculateNewImage } from "./calculate-image";
import { calculateEasingMap } from "./calculate-timeline";

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
			(styleTable[style.offset] = calculateBorderRadius(style))
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
	const styleTable = {};

	if (element.style.transform) {
		state_context.changeTimings.forEach((timing) => {
			//@ts-expect-error indexing
			styleTable[timing] = element.style.transform;
		});
	}

	state_mainElements.has(element) &&
		getKeyframes(element).forEach((style) => {
			if (!style.transform) {
				return;
			}
			//@ts-expect-error indexing
			styleTable[style.offset] = style.transform;
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

export const constructKeyframes = (element: HTMLElement): Animation[] => {
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

	const allAnimations = [];

	if (element.classList.contains("main")) {
		console.log({ keyframes });
	}

	if (element.tagName === "IMG") {
		allAnimations.push(
			...calculateNewImage(element as HTMLImageElement, easingTable)
		);
	} else {
		allAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	}

	return allAnimations;
};
