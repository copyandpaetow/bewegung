import { emptyNonZeroDOMRect } from "../../lib/flip/generate-difference-map";
import {
	calculateDimensionDifferences,
	DimensionalDifferences,
	Entry,
} from "../helper/calculate-dimension-differences";
import { iterateWeakMap } from "../helper/iterate-weakMap";
import { getComputedStylings, getDomRect } from "../helper/read-dimensions";
import { cssRuleName } from "../types";
import { mutation_createWAAPI } from "./animation";
import {
	getElements,
	state_mainElements,
	state_originalStyle,
} from "./elements";
import { timings, changeProperties, state_keyframes } from "./keyframes";

let state_dimensions = new WeakMap<HTMLElement, DOMRect[]>();

let state_calculatedStyle = new WeakMap<
	HTMLElement,
	Partial<CSSStyleDeclaration>[]
>();

export let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

export const readDOM = () => {
	timings.forEach((timing, index, array) => {
		// apply the keyframe styles to the main element
		dom_applyKeyframes(timing);
		// calculate the dimensions and change properties for all elements
		mutation_addDOMInformation(changeProperties);
		// reset on the last
		if (index === array.length - 1) {
			dom_reapplyOriginalStyle();
		}
	});
	mutation_calculateDifferences();
};

const mutation_addDOMInformation = (changeProperties: cssRuleName[]) => {
	getElements().forEach((element) => {
		state_dimensions.set(element, [
			...(state_dimensions.get(element) || []),
			getDomRect(element),
		]);
		state_calculatedStyle.set(element, [
			...(state_calculatedStyle.get(element) || []),
			getComputedStylings(changeProperties, element),
		]);
	});
};

const dom_applyKeyframes = (timing: number) => {
	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const currentStyleChange = value.find((frame) => frame.offset === timing);
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

const emptyCalculatedProperties = () =>
	timings.map((_) => ({
		dimensions: emptyNonZeroDOMRect,
		styles: getComputedStylings(changeProperties),
	}));

const mutation_calculateDifferences = () => {
	const elements = getElements();

	//TODO: either conmbine the states or find a way to iterate more states at once
	const entries = elements.map((element): [HTMLElement, Entry[]] => {
		const dimensions = state_dimensions.get(element);
		const styles = state_calculatedStyle.get(element);
		const entries = styles.map(
			(entry, index): Entry => ({
				dimensions: dimensions[index],
				styles: entry,
			})
		);
		return [element, entries];
	});
	const elementMap = new Map(entries);

	elements.map((element) => {
		const childEntries = elementMap.get(element);
		const parentEntries =
			elementMap.get(element.parentElement) ?? emptyCalculatedProperties();

		const calculated = childEntries.map((entry, index, array) => {
			const child: [Entry, Entry] = [entry, array[array.length - 1]];
			const parent: [Entry, Entry] = [
				parentEntries[index],
				parentEntries[array.length - 1],
			];
			//TODO: somehow the animation is wrong: is the problem coming from here?
			return calculateDimensionDifferences(child, parent, element);
		});
		state_calculatedDifferences.set(element, calculated);
	});
	mutation_createWAAPI();
};

export const cleanup_calculations = () => {
	state_dimensions = new WeakMap<HTMLElement, DOMRect[]>();

	state_calculatedStyle = new WeakMap<
		HTMLElement,
		Partial<CSSStyleDeclaration>[]
	>();
	state_calculatedDifferences = new WeakMap<
		HTMLElement,
		DimensionalDifferences[]
	>();
};
