import { findAffectedDOMElements } from "../lib/core/dom-find-affected-elements";
import {
	CalculatedProperties,
	getComputedStylings,
	getDomRect,
} from "../lib/core/main-read-dimensions";
import {
	calculateDimensionDifferences,
	DimensionalDifferences,
	Entry,
} from "../lib/flip/calculate-dimension-differences";
import { emptyNonZeroDOMRect } from "../lib/flip/generate-difference-map";
import { Callbacks } from "../lib/types";
import { iterateWeakMap } from "./helper";
import { cssRuleName } from "./types";

export const state_mainElements = new Set<HTMLElement>();

export const state_affectedElements = new Set<HTMLElement>();

export const state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();

export const state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();

export const state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();

export const state_originalStyle = new WeakMap<HTMLElement, string>();

export const state_dimensions = new WeakMap<HTMLElement, DOMRect[]>();

export const state_calculatedStyle = new WeakMap<
	HTMLElement,
	Partial<CSSStyleDeclaration>[]
>();

export const state_affectedByMainElements = new WeakMap<
	HTMLElement,
	Set<HTMLElement>
>();

export const state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

export const state_WAAPI = new WeakMap<HTMLElement, Animation>();

export const mutation_addElementState = (...elements: HTMLElement[]) => {
	elements.forEach((mainElement) => {
		state_mainElements.add(mainElement);
		state_originalStyle.set(mainElement, mainElement.style.cssText);
		findAffectedDOMElements(mainElement).forEach((affectedElement) => {
			if (elements.includes(affectedElement)) {
				return;
			}
			state_affectedElements.add(affectedElement);
			state_originalStyle.set(affectedElement, affectedElement.style.cssText);
			state_affectedByMainElements.set(
				affectedElement,
				new Set([
					...(state_affectedByMainElements.get(affectedElement) || new Set()),
					mainElement,
				])
			);
		});
	});
};

export const computed_runtime = (): number => {
	let longestDuration = 0;
	iterateWeakMap(
		state_mainElements,
		state_options
	)((value) => {
		longestDuration = Math.max(value.endTime, longestDuration);
	});

	return longestDuration;
};

export const computed_changingCSSProperties = (): cssRuleName[] => {
	const styles = new Set<cssRuleName>([
		"transformOrigin",
		"position",
		"display",
		"borderRadius",
		"font",
		"width",
	]);

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value) => {
		value.forEach(
			({ composite, computedOffset, easing, offset, ...stylings }) => {
				Object.keys(stylings).forEach((style) =>
					styles.add(style as cssRuleName)
				);
			}
		);
	});

	return Array.from(styles);
};

export const computed_changeTimings = () => {
	const timings = new Set([0, 1]);
	const totalRuntime = computed_runtime();

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key);

		timings.add((start as number) / totalRuntime);

		value.forEach(({ computedOffset }) => {
			timings.add(
				((end as number) * computedOffset + (start as number)) / totalRuntime
			);
		});

		timings.add((end as number) / totalRuntime);

		if ((endDelay as number) > 0) {
			timings.add(((end as number) + (endDelay as number)) / totalRuntime);
		}
	});
	return Array.from(timings).sort((a, b) => a - b);
};

export const mutation_updateKeyframes = () => {
	const totalRuntime = computed_runtime();

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key);

		const updatedKeyframes = value.map((frame) => {
			const absoluteTiming =
				((end as number) * frame.computedOffset +
					(start as number) +
					endDelay) /
				totalRuntime;
			return {
				...frame,
				offset: absoluteTiming,
				computedOffset: absoluteTiming,
			};
		});

		state_keyframes.set(key, updatedKeyframes);
	});
};

export const dom_applyKeyframes = (timing: number) => {
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

export const dom_reapplyOriginalStyle = () => {
	iterateWeakMap(
		state_mainElements,
		state_originalStyle
	)((value, key) => {
		key.style.cssText = value;
	});
};

export const mutation_addDOMInformation = (changeProperties: cssRuleName[]) => {
	const elements = [...state_mainElements, ...state_affectedElements];

	elements.forEach((element) => {
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

const emptyCalculatedProperties = () =>
	computed_changeTimings().map((changeValue) => ({
		dimensions: emptyNonZeroDOMRect,
		styles: getComputedStylings(computed_changingCSSProperties()),
	}));

export const mutation_calculateDifferences = () => {
	const elements = [...state_mainElements, ...state_affectedElements];

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
};

export const mutation_createWAAPI = () => {
	const elements = [...state_mainElements, ...state_affectedElements];

	elements.forEach((element) => {
		const keyframes = state_calculatedDifferences.get(element).map(
			({ xDifference, yDifference, widthDifference, heightDifference }) =>
				({
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);
		const options = state_options.get(element);

		state_WAAPI.set(
			element,
			new Animation(new KeyframeEffect(element, keyframes, options))
		);
	});
};

export const play_animation = () => {
	const elements = [...state_mainElements, ...state_affectedElements];

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const resultingStyle = value.reduce(
			(
				accumulator,
				{ offset, composite, computedOffset, easing, ...styles }
			) => {
				return { ...accumulator, ...styles };
			},
			{}
		);
		Object.assign(key.style, resultingStyle);
	});

	iterateWeakMap(elements, state_WAAPI)((value) => value.play());
};
