import { getAffectedElements } from "./prepare/affected-elements";
import { defaultTimings } from "./constants";
import { makeMainState, toSoA } from "./normalize/state";
import { calculateTotalRuntime } from "./prepare/runtime";
import { Queue } from "./shared";
import {
	AnimationsAPI,
	CustomKeyframeEffect,
	StructureOfChunks,
} from "./types";
import {
	updateCallbackOffsets,
	updateKeyframeOffsets,
} from "./prepare/offsets";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	const tasks = new Queue();
	let state: StructureOfChunks;
	let secondaryElements: HTMLElement[][];
	let totalRuntime = defaultTimings.duration as number;

	tasks
		.enqueue(
			() => (state = makeMainState(toSoA(props))),
			() =>
				(secondaryElements = getAffectedElements(
					state.elements,
					state.options
				)),
			() => (totalRuntime = calculateTotalRuntime(state.options)),
			() =>
				(state.keyframes = updateKeyframeOffsets(
					state.keyframes,
					state.options,
					totalRuntime
				)),
			() =>
				(state.callbacks = updateCallbackOffsets(
					state.callbacks,
					state.options,
					totalRuntime
				)),
			() => console.log({ state, secondaryElements, totalRuntime })
		)
		.run();

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
