import { iterateWeakMap } from "../helper/iterate-weakMap";
import { cssRuleName } from "../types";
import { mutate_callbacks } from "./callbacks";
import { state_mainElements } from "./elements";
import { state_options, totalRuntime } from "./options";

export let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();

export let changeProperties: cssRuleName[] = [
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

export let timings = [0, 1];
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

export const cleanup_keyframes = () => {
	state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
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
