import { emptyNonZeroDOMRect } from "../lib/flip/generate-difference-map";
import {
	calculatedElementProperties,
	calculateDimensionDifferences,
	DimensionalDifferences,
} from "./helper/calculate-dimension-differences";
import { getTimelineFractions, Timeline } from "./helper/calculate-timeline";
import { findAffectedDOMElements } from "./helper/dom-find-affected-elements";
import { getComputedStylings, getDomRect } from "./helper/read-dimensions";
import { Callbacks, Chunks, cssRuleName } from "./types";

export let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
export let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
export let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
export let state_affectedElements = new Set<HTMLElement>();
export let state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();

const state_targetSelectors = new WeakMap();
const state_mainElements: Set<HTMLElement>[] = [];

let state_elementProperties = new WeakMap<
	HTMLElement,
	calculatedElementProperties[]
>();

export let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();
let state_WAAPI = new WeakMap<HTMLElement, Animation>();
export let state_originalStyle = new WeakMap<HTMLElement, string>();

export const setState = (chunks: Chunks[], totalRuntime: number) => {
	chunks.forEach((chunk) => {
		const { target, options } = chunk;
		target.forEach((element) => state_options.set(element, options));
	});

	chunks.forEach((chunk) => {
		const { target, keyframes, options } = chunk;
		const { delay: start, duration: end, endDelay } = options;
		const updatedKeyframes = keyframes.map((frame) => {
			const absoluteTiming =
				((end as number) * frame.computedOffset +
					(start as number) +
					endDelay!) /
				totalRuntime;

			return {
				...frame,
				offset: absoluteTiming,
				computedOffset: absoluteTiming,
			};
		});
		target.forEach((element) => state_keyframes.set(element, updatedKeyframes));
	});

	chunks.forEach((chunk) => {
		const { target, callbacks, options } = chunk;
		const { delay: start, duration: end, endDelay } = options;
		const updatedCallbacks = callbacks?.map((frame) => {
			const absoluteTiming =
				((end as number) * frame.offset + (start as number) + endDelay!) /
				totalRuntime;

			return {
				...frame,
				offset: absoluteTiming,
			};
		});
		updatedCallbacks?.length &&
			target.forEach((element) =>
				state_callbacks.set(element, updatedCallbacks)
			);
	});

	chunks.forEach((chunk) => {
		const { target, selector } = chunk;
		const newIndex = state_mainElements.push(new Set(target)) - 1;

		if (selector) {
			state_targetSelectors.set(state_mainElements[newIndex], selector);
		}
	});
	const mainElements = new Set(chunks.flatMap((element) => element.target));
	chunks.forEach((chunk) => {
		const { target, options } = chunk;
		const { delay: start, duration: end, easing } = options;

		target.forEach((element) => {
			state_originalStyle.set(element, element.style.cssText);
			findAffectedDOMElements(element).forEach((affectedElement) => {
				if (mainElements.has(affectedElement)) {
					return;
				}
				state_affectedElements.add(affectedElement);
				state_affectedElementEasings.set(
					affectedElement,
					Array.from([
						...(state_affectedElementEasings.get(affectedElement) || []),
						{
							start: (start as number) / totalRuntime,
							end: (end as number) / totalRuntime,
							easing: easing as string,
						},
					])
				);
			});
		});
	});
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

export const calculate = (
	changeProperties: cssRuleName[],
	changeTimings: number[]
) => {
	const mainElements = [
		...state_mainElements.flatMap((element) => [...element]),
	];
	const affectedElements = [...state_affectedElements];

	changeTimings.forEach((timing, index, array) => {
		// apply the keyframe styles to the main element
		mainElements.forEach((element) => {
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
		});
		// calculate the dimensions and change properties for all elements
		[...mainElements, ...affectedElements].forEach((element) => {
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
		// reset on the last
		if (index === array.length - 1) {
			mainElements.forEach((element) => {
				const originalStyle = state_originalStyle.get(element) as string;

				element.style.cssText = originalStyle;
			});
		}
	});

	[...mainElements, ...affectedElements].forEach((element) => {
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
};

const calculateEasingMap = (mainElements: Timeline | undefined) => {
	if (!mainElements) {
		return {};
	}
	// const easingMap = new Map<HTMLElement, ComputedKeyframe[]>();
	const easingTable: Record<number, string> = {};

	getTimelineFractions(mainElements as Timeline).forEach(
		(entry, index, array) => {
			const { start } = entry;
			const nextIndex = array[index + 1] ? index + 1 : index;
			const nextEasing = array[nextIndex].easing as string;

			easingTable[start] = nextEasing;
		}
	);
	return easingTable;
};

export const animate = (totalRuntime: number) => {
	const mainElements = [
		...state_mainElements.flatMap((element) => [...element]),
	];
	const affectedElements = [...state_affectedElements];

	return [...mainElements, ...affectedElements].map((element) => {
		const options = state_options.get(element);
		const easingTable = calculateEasingMap(
			state_affectedElementEasings.get(element)
		);
		const keyframes = state_calculatedDifferences.get(element)!.map(
			({
				xDifference,
				yDifference,
				widthDifference,
				heightDifference,
				offset,
			}) =>
				({
					offset,
					computedOffset: offset,
					composite: "auto",
					easing: easingTable[offset] ?? options?.easing ?? "linear",
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);

		return new Animation(new KeyframeEffect(element, keyframes, totalRuntime));
	});
};

export const applyStyles = () => {
	const mainElements = [
		...state_mainElements.flatMap((element) => [...element]),
	];
	mainElements.forEach((element) => {
		const keyframes = state_keyframes.get(element);

		const resultingStyle = keyframes?.reduce(
			(
				accumulator,
				{ offset, composite, computedOffset, easing, ...styles }
			) => {
				return { ...accumulator, ...styles };
			},
			{}
		);
		Object.assign(element.style, resultingStyle);
	});
};
