import { defaultOptions } from "./constants";
import { fillState, makeState } from "./normalize/state";
import { fillAffectedElements } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { fillResets } from "./prepare/resets";
import { calculateTotalRuntime } from "./prepare/runtime";
import { fillCalculations } from "./read/calculate-keyframes";
import { fillReadouts } from "./read/dom";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import {
	AnimationsAPI,
	Context,
	CustomKeyframeEffect,
	DimensionalDifferences,
	ElementReadouts,
} from "./types";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	let now = performance.now();

	const state = makeState();
	const cssStyleReset = new WeakMap<HTMLElement, Map<string, string>>();
	const secondaryElements = new Map<HTMLElement, number[]>();

	const context: Context = { totalRuntime: defaultOptions.duration as number };

	function init() {
		const tasks = [
			() => fillState(state, props),
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
		//These could be a map<Element, Calculation[]> because they are iterable
		const readouts = new Map<HTMLElement, ElementReadouts[]>();
		const calculations = new Map<HTMLElement, DimensionalDifferences[]>();

		const tasks = [
			() =>
				fillReadouts(
					readouts,
					{ main: state.elements, secondary: Array.from(secondaryElements.keys()) },
					{ keyframes: state.keyframes, resets: cssStyleReset }
				),
			//filter elements here
			() => adjustForDisplayNone(readouts),
			() => fillCalculations(calculations, readouts),
		];

		tasks.forEach(scheduleCallback);
	}

	init();

	scheduleCallback(() =>
		console.log({
			state,

			totalRuntime: context.totalRuntime,
			duration: performance.now() - now,
		})
	);

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
