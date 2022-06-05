import { findAffectedDOMElements } from "../lib/core/dom-find-affected-elements";
import {
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

let state_mainElements = new Set<HTMLElement>();

let state_affectedElements = new Set<HTMLElement>();

let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();

let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();

let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();

let state_originalStyle = new WeakMap<HTMLElement, string>();

let state_dimensions = new WeakMap<HTMLElement, DOMRect[]>();

let state_calculatedStyle = new WeakMap<
	HTMLElement,
	Partial<CSSStyleDeclaration>[]
>();

let state_affectedByMainElements = new WeakMap<HTMLElement, Set<HTMLElement>>();

let state_calculatedDifferences = new WeakMap<
	HTMLElement,
	DimensionalDifferences[]
>();

let state_WAAPI = new WeakMap<HTMLElement, Animation>();

let totalRuntime = 0;
const compute_runtime = () => {
	let longestDuration = 0;
	iterateWeakMap(
		state_mainElements,
		state_options
	)((value) => {
		longestDuration = Math.max(value.endTime, longestDuration);
	});

	totalRuntime = longestDuration;
};
let changeProperties: cssRuleName[] = [
	"transformOrigin",
	"position",
	"display",
	"borderRadius",
	"font",
	"width",
];

export function compute_changingCSSProperties() {
	const newStyles = new Set<cssRuleName>(changeProperties);

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value) => {
		value.forEach(
			({ composite, computedOffset, easing, offset, ...stylings }) => {
				Object.keys(stylings).forEach((style) =>
					newStyles.add(style as cssRuleName)
				);
			}
		);
	});

	changeProperties = Array.from(newStyles);
}

let timings = [0, 1];
export function compute_changeTimings() {
	const newTimings = new Set(timings);

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key);

		newTimings.add((start as number) / totalRuntime);

		value.forEach(({ computedOffset }) => {
			newTimings.add(
				((end as number) * computedOffset + (start as number)) / totalRuntime
			);
		});

		newTimings.add((end as number) / totalRuntime);

		if ((endDelay as number) > 0) {
			newTimings.add(((end as number) + (endDelay as number)) / totalRuntime);
		}
	});
	timings = Array.from(newTimings).sort((a, b) => a - b);
}

const updateDOMStates = (elements: HTMLElement[]) => {
	//TODO: if these states get recalculated, they need to be reset before
	elements.forEach((mainElement) => {
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

export const mutate_mainElements = (...elements: HTMLElement[]) => {
	const listeners = [
		() => updateDOMStates(Array.from(state_mainElements)),
		mutate_options,
	];

	elements.forEach((element) => {
		state_mainElements.has(element)
			? state_mainElements.delete(element)
			: state_mainElements.add(element);
	});

	listeners.forEach((callback) => callback());
};

//TODO: this would need to get overload so it can has 2+1 input or none
export const mutate_options = (
	element?: HTMLElement,
	option?: ComputedEffectTiming,
	hasNext?: boolean
) => {
	const listeners = [compute_runtime, mutate_keyframeState];
	if (element && option) {
		state_options.set(element, option);
	}

	if (!hasNext) {
		listeners.forEach((callback) => callback());
	}
};

const mutate_updateKeyframes = () => {
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

export const mutate_keyframeState = (
	element?: HTMLElement,
	keyframe?: ComputedKeyframe[],
	hasNext?: boolean
) => {
	const listeners = [
		compute_changeTimings,
		compute_changingCSSProperties,
		mutate_updateKeyframes,
		mutate_callbacks,
	];

	if (element && keyframe) {
		state_keyframes.set(element, keyframe);
	}
	if (!Boolean(hasNext)) {
		listeners.forEach((callback) => callback());
	}
};

const mutate_updateCallbacks = () => {
	iterateWeakMap(
		state_mainElements,
		state_callbacks
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key);

		const updatedKeyframes = value.map((frame) => {
			const absoluteTiming =
				((end as number) * frame.offset + (start as number) + endDelay) /
				totalRuntime;
			return {
				...frame,
				offset: absoluteTiming,
			};
		});

		state_callbacks.set(key, updatedKeyframes);
	});
};

export const mutate_callbacks = (
	element?: HTMLElement,
	callback?: Callbacks[],
	hasNext?: boolean
) => {
	//?before the readDOM call there could be a function to check for errors?
	//* it must be made in a way, that it can be called from the resizeObserver
	const listeners = [mutate_updateCallbacks, readDOM];

	if (element && callback) {
		state_callbacks.set(element, callback);
	}
	if (!hasNext) {
		listeners.forEach((callback) => callback());
	}
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

const mutation_addDOMInformation = (changeProperties: cssRuleName[]) => {
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
	postProccessing();
};

export const postProccessing = () => {
	mutation_calculateDifferences();
	mutation_createWAAPI();
};

const emptyCalculatedProperties = () =>
	timings.map((_) => ({
		dimensions: emptyNonZeroDOMRect,
		styles: getComputedStylings(changeProperties),
	}));

const mutation_calculateDifferences = () => {
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

		console.log({
			element,
			parent: element.parentElement,
			parentEntries,
			childEntries,
			state_dimensions,
		});

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

const mutation_createWAAPI = () => {
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
	console.log({ elements });
	iterateWeakMap(elements, state_WAAPI)((value) => value.play());
};

export const cleanup = () => {
	state_mainElements = new Set<HTMLElement>();

	state_affectedElements = new Set<HTMLElement>();

	state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();

	state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();

	state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();

	state_originalStyle = new WeakMap<HTMLElement, string>();

	state_dimensions = new WeakMap<HTMLElement, DOMRect[]>();

	state_calculatedStyle = new WeakMap<
		HTMLElement,
		Partial<CSSStyleDeclaration>[]
	>();

	state_affectedByMainElements = new WeakMap<HTMLElement, Set<HTMLElement>>();

	state_calculatedDifferences = new WeakMap<
		HTMLElement,
		DimensionalDifferences[]
	>();

	state_WAAPI = new WeakMap<HTMLElement, Animation>();

	totalRuntime = 0;
	timings = [0, 1];
	changeProperties = [
		"transformOrigin",
		"position",
		"display",
		"borderRadius",
		"font",
		"width",
	];
};
