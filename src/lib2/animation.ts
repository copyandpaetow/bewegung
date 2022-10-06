import { defaultOptions } from "./constants";
import { fillState } from "./normalize/state";
import { fillAffectedElements } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { fillResets } from "./prepare/resets";
import { calculateTotalRuntime } from "./prepare/runtime";
import {
	makeCaluclations,
	makeComputedState,
	makeOverrides,
	makeReadouts,
	makeState,
} from "./prepare/state";
import { fillCalculations } from "./read/calculate-keyframes";
import { fillReadouts } from "./read/dom";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import { AnimationsAPI, Context, CustomKeyframeEffect } from "./types";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	let now = performance.now();

	const state = makeState();
	const computedState = makeComputedState();
	const overrides = makeOverrides();
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
			() => fillAffectedElements(computedState.secondaryElements, state.elements, state.options),
			() => fillResets(computedState.cssStyleReset, state.elements),
			read,
		];

		tasks.forEach(scheduleCallback);
	}

	function read() {
		const readouts = makeReadouts();
		const calculations = makeCaluclations();

		const tasks = [
			() => fillReadouts(readouts, state, computedState),
			() => adjustForDisplayNone(readouts),
			() => fillCalculations(calculations, readouts),
		];

		tasks.forEach(scheduleCallback);
	}

	init();

	scheduleCallback(() =>
		console.log({
			state,
			computedState,
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
