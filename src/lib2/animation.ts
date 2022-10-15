import { defaultOptions } from "./constants";
import { fillState, makeState } from "./normalize/state";
import { fillAffectedElements } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { fillResets } from "./prepare/resets";
import { calculateTotalRuntime } from "./prepare/runtime";
import { fillCalculations } from "./read/calculate-keyframes";
import { fillReadouts } from "./read/dom";
import { filterReadouts } from "./read/filter-readouts";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import {
	AnimationsAPI,
	Context,
	CustomKeyframeEffect,
	DimensionalDifferences,
	ElementReadouts,
	Overrides,
} from "./types";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	let now = performance.now();

	const state = makeState();
	const cssStyleReset = new WeakMap<HTMLElement, Map<string, string>>();
	const secondaryElements = new Map<HTMLElement, number[]>();
	const animations: Animation[] = [];

	const context: Context = { totalRuntime: defaultOptions.duration as number };

	function init() {
		const tasks = [
			() => fillState(state, props),
			//TODO: these should be separate, so they can be recalculated independently from the state
			() => calculateTotalRuntime(context, state.options),
			() => updateKeyframeOffsets(state.keyframes, state.options, context.totalRuntime),
			() => updateCallbackOffsets(state.callbacks, state.options, context.totalRuntime),
			computed,
		];

		tasks.forEach(scheduleCallback);
	}

	function computed() {
		const tasks = [
			() => fillAffectedElements(secondaryElements, state.elements, state.options),
			() => fillResets(cssStyleReset, state.elements),
			read,
		];

		tasks.forEach(scheduleCallback);
	}

	function read() {
		const readouts = new Map<HTMLElement, ElementReadouts[]>();
		const defaultCalculations = new Map<HTMLElement, DimensionalDifferences[]>();
		const imageCalculations = new Map<HTMLElement, DimensionalDifferences[]>();
		const overrides = new WeakMap<HTMLElement, Overrides>();

		const tasks = [
			() =>
				fillReadouts(
					readouts,
					{ main: state.elements, secondary: Array.from(secondaryElements.keys()) },
					{ keyframes: state.keyframes, resets: cssStyleReset }
				),
			//() => filterReadouts(readouts, (element) => secondaryElements.delete(element)),
			() => adjustForDisplayNone(readouts),
			//TODO this only needs to happen for the non-image elements,
			() => fillCalculations(defaultCalculations, readouts),
		];

		tasks.forEach(scheduleCallback);
	}

	init();

	scheduleCallback(() =>
		console.log({
			duration: performance.now() - now,
		})
	);

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
