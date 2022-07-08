import { animate } from "../animate/animate";
import {
	getKeyframes,
	state_affectedElements,
	state_mainElements,
	state_originalStyle,
} from "../prepare/prepare";
import {
	calculatedElementProperties,
	Context,
	DimensionalDifferences,
	Observerable,
} from "../types";
import {
	calculateDimensionDifferences,
	emptyCalculatedProperties,
} from "./differences";
import { getComputedStylings, getDomRect } from "./dimensions";

export let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();
export let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

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

export const filterMatchingStyleFromKeyframes = (
	element: HTMLElement,
	timing?: number
) => {
	const keyframes = getKeyframes(element);
	let resultingStyle = {};
	keyframes?.forEach((keyframe) => {
		const { offset, composite, computedOffset, easing, ...styles } = keyframe;
		if (timing !== undefined && timing !== offset) {
			return;
		}
		resultingStyle = { ...resultingStyle, ...styles };
	});

	if (Object.values(resultingStyle).length === 0) {
		return;
	}

	Object.assign(element.style, resultingStyle);
};

export const calculate = (Context: Observerable<Context>) => {
	cleanup();
	const allElements = new Set([
		...state_mainElements,
		...state_affectedElements,
	]);
	const { changeProperties, changeTimings } = Context();

	changeTimings.forEach((timing, index, array) => {
		state_mainElements.forEach((element) =>
			filterMatchingStyleFromKeyframes(element, timing)
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
				return calculateDimensionDifferences(child, parent);
			}
		);

		state_calculatedDifferences.set(element, calculatedDifferences);
	});

	return animate(Context);
};
