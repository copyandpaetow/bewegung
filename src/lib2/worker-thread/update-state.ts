import { WorkerState, KeyedCustomKeyframeEffect, NormalizedCustomKeyframeEffect } from "../types";
import {
	updateChangeTimings,
	updateChangeProperties,
	calculateAppliableKeyframes,
} from "./calculate-dom-changes";
import { updateTotalRuntime } from "./calculate-runtime";
import { unifyKeyframeStructure } from "./normalize-keyframe-structure";
import { fillImplicitKeyframes, updateOffsets } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";

const normalizeTransferables = ([
	keys,
	keyframes,
	options,
]: KeyedCustomKeyframeEffect): NormalizedCustomKeyframeEffect => {
	const normalizedKeyframes = fillImplicitKeyframes(unifyKeyframeStructure(keyframes));
	const normalizedOptions = normalizeOptions(options);

	return [keys, normalizedKeyframes, normalizedOptions];
};

export const setMainState = (
	state: WorkerState,
	mainTransferables: KeyedCustomKeyframeEffect[]
) => {
	const normalizedTransferables = mainTransferables.map(normalizeTransferables);
	updateTotalRuntime(state, normalizedTransferables);

	normalizedTransferables.forEach(([keys, keyframeEntry, optionEntry]) => {
		const { keyframes, options } = state;
		const updatedKeyframes = updateOffsets(keyframeEntry, optionEntry, state.totalRuntime);
		updateChangeTimings(state, updatedKeyframes);
		updateChangeProperties(state, updatedKeyframes);

		keys.forEach((key) => {
			keyframes.set(key, (keyframes.get(key) ?? []).concat(updatedKeyframes));
			options.set(key, (options.get(key) ?? []).concat(optionEntry));
		});
	});

	state.appliableKeyframes = calculateAppliableKeyframes(state.keyframes, state.changeTimings);
	state.remainingKeyframes = state.appliableKeyframes.length;
};
