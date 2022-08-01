import { animate } from "../animate/animate";
import {
	getAllElements,
	getKeyframes,
	state_context,
	state_mainElements,
	state_originalStyle,
} from "../prepare/prepare";
import {
	calculatedElementProperties,
	differenceArray,
	DimensionalDifferences,
} from "../types";
import {
	calculateDimensionDifferences,
	checkForTextNode,
	emptyCalculatedProperties,
} from "./differences";
import { getComputedStylings, getDomRect } from "./dimensions";
import { recalculateDisplayNoneValues } from "./postprocess";

export let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();

export let state_elementStyleOverrides = new WeakMap<
	HTMLElement,
	{
		existingStyle: Partial<CSSStyleDeclaration>;
		override: Partial<CSSStyleDeclaration>;
	}
>();

const cleanup = () => {
	state_elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
	>();
	state_elementStyleOverrides = new WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>();
};

export const addOverrideStyles = (element: HTMLElement) => {
	const styleProperties = state_elementProperties.get(element)!;
	const keyframes = state_mainElements.has(element)
		? getKeyframes(element)
		: [];
	let override: Partial<CSSStyleDeclaration> | undefined;
	let existingStyle: Partial<CSSStyleDeclaration> | undefined;

	styleProperties.some((entry) => {
		if (
			entry.computedStyle.display !== "inline" ||
			element.tagName !== "SPAN"
		) {
			return false;
		}
		existingStyle = {
			...existingStyle,
			display: (keyframes.filter((keyframe) => keyframe?.display).at(-1) ??
				"") as string,
		};
		override = { ...override, display: "inline-block" };
		return true;
	});

	styleProperties.some((entry) => {
		if (entry.computedStyle.borderRadius === "0px") {
			return false;
		}
		existingStyle = {
			...existingStyle,
			borderRadius: (keyframes
				.filter((keyframe) => keyframe?.borderRadius)
				.at(-1) ?? "") as string,
		};
		override = { ...override, borderRadius: "0px" };
		return true;
	});

	if (!override || !existingStyle) {
		return;
	}
	state_elementStyleOverrides.set(element, { existingStyle, override });
};

export const getTransformValues = (
	element: HTMLElement
): DimensionalDifferences[] => {
	const { changeProperties, changeTimings } = state_context;
	const parentEntries =
		state_elementProperties.get(element.parentElement!) ??
		emptyCalculatedProperties(changeProperties, changeTimings);
	const elementProperties = state_elementProperties.get(element)!;
	const isTextNode = checkForTextNode(element);

	return elementProperties.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentEntries[index],
			parentEntries.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const applyCSSStyles = (
	element: HTMLElement,
	style: Partial<CSSStyleDeclaration>
) => {
	if (Object.values(style).length === 0) {
		return false;
	}
	Object.assign(element.style, style);
	return true;
};

export const filterMatchingStyleFromKeyframes = (
	element: HTMLElement,
	timing?: number
) => {
	const keyframes = getKeyframes(element);
	let resultingStyle: Partial<CSSStyleDeclaration> = {};
	keyframes?.forEach((keyframe) => {
		if (timing !== undefined && timing !== keyframe.offset) {
			return;
		}

		const { offset, composite, computedOffset, easing, transform, ...styles } =
			keyframe;

		resultingStyle = {
			...resultingStyle,
			...(timing === undefined && {
				transform: transform as string | undefined,
			}),
			...styles,
		};
	});

	return resultingStyle;
};

export const calculate = () => {
	cleanup();
	const allElements = [...getAllElements(), document.body];
	const { changeProperties, changeTimings } = state_context;

	changeTimings.forEach((timing, index, array) => {
		state_mainElements.forEach((element) =>
			applyCSSStyles(element, filterMatchingStyleFromKeyframes(element, timing))
		);
		allElements.forEach((element) => {
			const newCalculation: calculatedElementProperties = {
				dimensions: getDomRect(element),
				offset: timing,
				computedStyle: getComputedStylings(changeProperties, element),
			};
			state_elementProperties.set(element, [
				...(state_elementProperties.get(element) || []),
				newCalculation,
			]);
		});
		if (index === array.length - 1) {
			state_mainElements.forEach((element) => {
				element.style.cssText = state_originalStyle.get(element)!;
			});
		}
	});

	//TODO: here could be a good place to post process values

	allElements.forEach((element) => {
		state_elementProperties.set(element, recalculateDisplayNoneValues(element));
		addOverrideStyles(element);
	});

	return animate();
};
