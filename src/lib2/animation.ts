import { getAffectedElements } from "./prepare/affected-elements";
import { defaultTimings } from "./constants";
import { fillState } from "./normalize/state";
import { calculateTotalRuntime } from "./prepare/runtime";

import {
	AnimationsAPI,
	CustomKeyframeEffect,
	StructureOfChunks,
} from "./types";
import {
	updateCallbackOffsets,
	updateKeyframeOffsets,
} from "./prepare/offsets";
import { scheduleCallback } from "./scheduler";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	let state: StructureOfChunks;
	let secondaryElements: HTMLElement[][];
	let totalRuntime = defaultTimings.duration as number;
	let now = performance.now();

	const init = async () => {
		state = await fillState(props);
		secondaryElements = await getAffectedElements(
			state.elements,
			state.options
		);
		scheduleCallback(
			() => (totalRuntime = calculateTotalRuntime(state.options))
		);
		scheduleCallback(
			() =>
				(state.keyframes = updateKeyframeOffsets(
					state.keyframes,
					state.options,
					totalRuntime
				))
		);
		scheduleCallback(
			() =>
				(state.callbacks = updateCallbackOffsets(
					state.callbacks,
					state.options,
					totalRuntime
				))
		);
		scheduleCallback(() =>
			console.log({
				state,
				secondaryElements,
				totalRuntime,
				duration: performance.now() - now,
			})
		);
	};

	init();

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
