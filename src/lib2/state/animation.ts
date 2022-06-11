import { getTimelineFractions, Timeline } from "../helper/calculate-timeline";
import { iterateWeakMap } from "../helper/iterables";
import { state_calculatedDifferences } from "./calculations";
import {
	state_mainElements,
	getElements,
	state_affectedByMainElements,
} from "./elements";
import { state_keyframes } from "./keyframes";
import { state_options, totalRuntime } from "./options";

let state_WAAPI = new WeakMap<HTMLElement, Animation>();

const cleanup_animations = () => {
	state_WAAPI = new WeakMap<HTMLElement, Animation>();
};

export const play_animation = () => {
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

	iterateWeakMap(
		getElements(),
		state_WAAPI
	)((value) => {
		value.play();
	});
};

export const pause_animation = () => {
	iterateWeakMap(
		getElements(),
		state_WAAPI
	)((value) => {
		value.pause();
	});
};

export const mutation_createWAAPI = () => {
	cleanup_animations();
	getElements().forEach((element) => {
		const options = state_options.get(element);
		const easingTable = calculateEasingMap(
			state_affectedByMainElements.get(element)
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

		state_WAAPI.set(
			element,
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});
};

export const finishPromise = () => {
	const promises: Promise<Animation>[] = [];
	iterateWeakMap(
		getElements(),
		state_WAAPI
	)((value) => promises.push(value.finished));
	return Promise.all(promises);
};

const calculateEasingMap = (mainElements: Set<HTMLElement> | undefined) => {
	if (!mainElements) {
		return {};
	}
	// const easingMap = new Map<HTMLElement, ComputedKeyframe[]>();
	const easingTable: Record<number, string> = {};

	const mainElementTimings = Array.from(mainElements).map((mainElement) => {
		const {
			delay: start,
			duration: end,
			easing,
		} = state_options.get(mainElement) as ComputedEffectTiming;
		return {
			start: (start as number) / totalRuntime,
			end: (end as number) / totalRuntime,
			easing,
		};
	});
	getTimelineFractions(mainElementTimings as Timeline).forEach(
		(entry, index, array) => {
			const { start } = entry;
			const nextIndex = array[index + 1] ? index + 1 : index;
			const nextEasing = array[nextIndex].easing as string;

			easingTable[start] = nextEasing;
		}
	);
	return easingTable;
};
