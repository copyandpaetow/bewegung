import { execute, iterateWeakMap } from "../helper/iterables";
import { cssRuleName } from "../types";
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

export const compute_changingCSSProperties = () => {
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
};

export let timings = [0, 1];
export const compute_changeTimings = () => {
	const newTimings = new Set(timings);

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key)!;

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
};

const mutate_updateOffsets = () => {
	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const { delay: start, duration: end, endDelay } = state_options.get(key)!;

		const updatedKeyframes = value.map((frame) => {
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

		state_keyframes.set(key, updatedKeyframes);
	});
};

const flow = execute(
	compute_changeTimings,
	compute_changingCSSProperties,
	mutate_updateOffsets
);

export const action_updateKeyframes = () => {
	flow();
};