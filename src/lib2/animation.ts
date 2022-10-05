import { fillAffectedElements } from "./prepare/affected-elements";
import { fillState } from "./normalize/state";
import { calculateTotalRuntime } from "./prepare/runtime";

import { AnimationsAPI, Context, CustomKeyframeEffect, StructureOfChunks } from "./types";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { scheduleCallback } from "./scheduler";
import { defaultOptions } from "./constants";

const makeState = (): StructureOfChunks =>
	Object.freeze({
		elements: [],
		keyframes: [],
		callbacks: [],
		options: [],
		selectors: [],
	});

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	const state = makeState();
	const secondaryElements: HTMLElement[][] = [];
	const context: Context = { totalRuntime: defaultOptions.duration as number };
	let now = performance.now();

	function init() {
		const tasks = [
			() => fillState(state, props),
			() => calculateTotalRuntime(context, state.options),
			() => updateKeyframeOffsets(state.keyframes, state.options, context.totalRuntime),
			() => updateCallbackOffsets(state.callbacks, state.options, context.totalRuntime),
			getSecondaryStructures,
		];

		tasks.forEach(scheduleCallback);
	}

	function getSecondaryStructures() {
		const tasks = [() => fillAffectedElements(secondaryElements, state.elements, state.options)];

		tasks.forEach(scheduleCallback);
	}

	init();

	scheduleCallback(() =>
		console.log({
			state,
			secondaryElements,
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
