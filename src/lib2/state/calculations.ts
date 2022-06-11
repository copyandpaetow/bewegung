import { emptyNonZeroDOMRect } from "../../lib/flip/generate-difference-map";
import {
	calculateDimensionDifferences,
	DimensionalDifferences,
} from "../helper/calculate-dimension-differences";
import { iterateWeakMap } from "../helper/iterables";
import { getComputedStylings, getDomRect } from "../helper/read-dimensions";
import { cssRuleName } from "../types";
import {
	getElements,
	state_mainElements,
	state_originalStyle,
} from "./elements";
import { timings, changeProperties, state_keyframes } from "./keyframes";

export type calculatedElementProperties = {
	dimensions: DOMRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
};

let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();

export let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

const cleanup_calculations = () => {
	state_elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
	>();
	state_calculatedDifferences = new WeakMap<
		HTMLElement,
		DimensionalDifferences[]
	>();
};

const dom_applyKeyframes = (timing: number) => {
	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const currentStyleChange = value.find(
			(keyframe) => keyframe.offset === timing
		);
		if (!currentStyleChange) {
			return;
		}
		const { offset, composite, computedOffset, easing, ...cssStyles } =
			currentStyleChange;

		Object.assign(key.style, cssStyles);
	});
};

const dom_reapplyOriginalStyle = () => {
	iterateWeakMap(
		state_mainElements,
		state_originalStyle
	)((value, key) => {
		key.style.cssText = value;
	});
};

const mutation_addDOMInformation = (
	timing: number,
	changeProperties: cssRuleName[]
) => {
	getElements().forEach((element) => {
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
};

export const action_readDom = () => {
	cleanup_calculations();
	timings.forEach((timing, index, array) => {
		// apply the keyframe styles to the main element
		dom_applyKeyframes(timing);
		// calculate the dimensions and change properties for all elements
		mutation_addDOMInformation(timing, changeProperties);
		// reset on the last
		if (index === array.length - 1) {
			dom_reapplyOriginalStyle();
		}
	});
};

const emptyCalculatedProperties = (): calculatedElementProperties[] =>
	timings.map((timing) => ({
		dimensions: emptyNonZeroDOMRect,
		computedStyle: getComputedStylings(changeProperties),
		offset: timing,
	}));

export const mutation_calculateDifferences = () => {
	iterateWeakMap(
		getElements(),
		state_elementProperties
	)((value, key) => {
		const parentEntries =
			state_elementProperties.get(key.parentElement!) ??
			emptyCalculatedProperties();

		const calculatedDifferences = value.map(
			(calculatedProperty, index, array) => {
				const child: [
					calculatedElementProperties,
					calculatedElementProperties
				] = [calculatedProperty, array.at(-1)!];
				const parent: [
					calculatedElementProperties,
					calculatedElementProperties
				] = [parentEntries[index], parentEntries.at(-1)!];
				return calculateDimensionDifferences(child, parent, key);
			}
		);

		state_calculatedDifferences.set(key, calculatedDifferences);
	});
};
