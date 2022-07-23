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
	emptyCalculatedProperties,
} from "./differences";
import { getComputedStylings, getDomRect } from "./dimensions";

export let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();

const cleanup = () => {
	state_elementProperties = new WeakMap<
		HTMLElement,
		calculatedElementProperties[]
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

const recalculateDisplayNoneValues = (
	element: HTMLElement
): calculatedElementProperties[] => {
	const existingCalculations = state_elementProperties.get(element)!;

	if (
		existingCalculations.every(
			(entry) => entry.computedStyle.display !== "none"
		)
	) {
		return existingCalculations;
	}

	return existingCalculations.map((entry, index, array) => {
		if (entry.computedStyle.display !== "none") {
			return entry;
		}
		const nextEntryDimensions = (
			array
				.slice(0, index)
				.reverse()
				.find((entry) => entry.computedStyle.display !== "none") ||
			array.slice(index).find((entry) => entry.computedStyle.display !== "none")
		)?.dimensions;

		if (!nextEntryDimensions) {
			return entry;
		}

		return {
			...entry,
			dimensions: { ...nextEntryDimensions, width: 0, height: 0 },
		};
	});
};

export const calculate = () => {
	cleanup();
	const allElements = getAllElements();
	const { changeProperties, changeTimings } = state_context;

	changeTimings.forEach((timing, index, array) => {
		state_mainElements.forEach((element) =>
			//TODO: in here the rotate needs to be extracted
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
		state_elementProperties.set(element, recalculateDisplayNoneValues(element));
	});

	return animate();
};

export const getTransformValues = (
	element: HTMLElement
): DimensionalDifferences[] => {
	const { changeProperties, changeTimings } = state_context;
	const parentEntries =
		state_elementProperties.get(element.parentElement!) ??
		emptyCalculatedProperties(changeProperties, changeTimings);
	const elementProperties = state_elementProperties.get(element)!;

	return elementProperties.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentEntries[index],
			parentEntries.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, element);
	});
};
