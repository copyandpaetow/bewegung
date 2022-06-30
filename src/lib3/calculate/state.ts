import { Context } from "../elements/context";
import {
	state_affectedElements,
	state_keyframes,
	state_mainElements,
} from "../elements/state";
import { cssRuleName } from "../types";
import {
	calculatedElementProperties,
	DimensionalDifferences,
	calculateDimensionDifferences,
} from "./calculate-differences";
import { getComputedStylings, getDomRect } from "./read-dimensions";

export let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();
export let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

export const emptyNonZeroDOMRect: DOMRect = {
	width: 1,
	height: 1,
	x: 0,
	y: 0,
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	toJSON: () => undefined,
};

const emptyCalculatedProperties = (
	changeProperties: cssRuleName[],
	changeTimings: number[]
): calculatedElementProperties[] =>
	changeTimings.map((timing) => ({
		dimensions: emptyNonZeroDOMRect,
		computedStyle: getComputedStylings(changeProperties),
		offset: timing,
	}));

const cleanup = () => {
	state_elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
	>();
	state_calculatedDifferences = new WeakMap<
		HTMLElement,
		DimensionalDifferences[]
	>();
};

export const calculate = () => {
	cleanup();
	const allElements = new Set([
		...state_mainElements,
		...state_affectedElements,
	]);
	const { changeProperties, changeTimings } = Context;

	changeTimings.forEach((timing, index, array) => {
		state_mainElements.forEach((element) => {
			const originalStyle = element.style.cssText;
			const keyframes = state_keyframes.get(element);
			const currentStyleChange = keyframes?.find(
				(keyframe) => keyframe.offset === timing
			);
			if (!currentStyleChange) {
				return;
			}
			const { offset, composite, computedOffset, easing, ...cssStyles } =
				currentStyleChange;

			Object.assign(element.style, cssStyles);

			element.addEventListener(
				"bewegung-restore",
				() => (element.style.cssText = originalStyle),
				{
					once: true,
				}
			);
		});
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
				element.dispatchEvent(new CustomEvent("bewegung-restore"));
			});
		}
	});

	allElements.forEach((element) => {
		const parentEntries =
			state_elementProperties.get(element.parentElement!) ??
			emptyCalculatedProperties(changeProperties, changeTimings);
		const elementProperties = state_elementProperties.get(element)!;

		const calculatedDifferences = elementProperties.map(
			(calculatedProperty, index, array) => {
				const child: [
					calculatedElementProperties,
					calculatedElementProperties
				] = [calculatedProperty, array.at(-1)!];
				const parent: [
					calculatedElementProperties,
					calculatedElementProperties
				] = [parentEntries[index], parentEntries.at(-1)!];
				return calculateDimensionDifferences(child, parent, element);
			}
		);

		state_calculatedDifferences.set(element, calculatedDifferences);
	});

	return;
};
