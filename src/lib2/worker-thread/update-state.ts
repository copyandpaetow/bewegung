import { defaultChangeProperties } from "../shared/constants";
import {
	BewegungsOptions,
	CustomKeyframe,
	KeyedCustomKeyframeEffect,
	MainElementState,
	NormalizedCustomKeyframeEffect,
} from "../types";
import {
	calculateAppliableKeyframes,
	updateChangeProperties,
	updateChangeTimings,
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

export const setMainState = (mainTransferables: KeyedCustomKeyframeEffect[]): MainElementState => {
	const normalizedTransferables = mainTransferables.map(normalizeTransferables);
	const keyframes = new Map<string, CustomKeyframe[]>();
	const options = new Map<string, BewegungsOptions[]>();
	const changeProperties = new Set(defaultChangeProperties);
	const changeTimings = new Set([0, 1]);
	const totalRuntime = updateTotalRuntime(normalizedTransferables);

	normalizedTransferables.forEach(([elementIDs, currentKeyframes, currentOption]) => {
		const updatedKeyframes = fillImplicitKeyframes(
			updateOffsets(currentKeyframes, currentOption, totalRuntime)
		);
		updateChangeTimings(changeTimings, updatedKeyframes);
		updateChangeProperties(changeProperties, updatedKeyframes);

		elementIDs.forEach((currentID) => {
			keyframes.set(currentID, (keyframes.get(currentID) ?? []).concat(updatedKeyframes));
			options.set(currentID, (options.get(currentID) ?? []).concat(currentOption));
		});
	});

	const sortedChangeTimings = Array.from(changeTimings).sort((a, b) => a - b);
	const appliableKeyframes = calculateAppliableKeyframes(keyframes, sortedChangeTimings);

	return {
		options,
		appliableKeyframes,
		totalRuntime,
		changeProperties: changeProperties,
		changeTimings: sortedChangeTimings,
	};
};
