import { defaultChangeProperties } from "../shared/constants";
import {
	WorkerState,
	KeyedCustomKeyframeEffect,
	NormalizedCustomKeyframeEffect,
	CustomKeyframe,
	BewegungsOptions,
	EntryType,
	ElementReadouts,
} from "../types";
import {
	updateChangeTimings,
	updateChangeProperties,
	calculateAppliableKeyframes,
} from "./calculate-dom-changes";
import { updateTotalRuntime } from "./calculate-runtime";
import { unifyKeyframeStructure } from "./normalize-keyframe-structure";
import { fillImplicitKeyframes, updateOffsets } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";

const getOtherStateRelatedEntries = () => ({
	root: new Map<string, string>(),
	parent: new Map<string, string>(),
	affectedBy: new Map<string, string[]>(),
	ratio: new Map<string, number>(),
	type: new Map<string, EntryType>(),
	overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
	readouts: new Map<string, ElementReadouts[]>(),
});

const normalizeTransferables = ([
	keys,
	keyframes,
	options,
]: KeyedCustomKeyframeEffect): NormalizedCustomKeyframeEffect => {
	const normalizedKeyframes = fillImplicitKeyframes(unifyKeyframeStructure(keyframes));
	const normalizedOptions = normalizeOptions(options);

	return [keys, normalizedKeyframes, normalizedOptions];
};

export const setMainState = (mainTransferables: KeyedCustomKeyframeEffect[]): WorkerState => {
	const normalizedTransferables = mainTransferables.map(normalizeTransferables);
	const keyframes = new Map<string, CustomKeyframe[]>();
	const options = new Map<string, BewegungsOptions[]>();
	const changeProperties = new Set(defaultChangeProperties);
	const changeTimings = new Set([0, 1]);
	const totalRuntime = updateTotalRuntime(normalizedTransferables);

	normalizedTransferables.forEach(([keys, keyframeEntry, optionEntry]) => {
		const updatedKeyframes = updateOffsets(keyframeEntry, optionEntry, totalRuntime);
		updateChangeTimings(changeTimings, updatedKeyframes);
		updateChangeProperties(changeProperties, updatedKeyframes);

		keys.forEach((key) => {
			keyframes.set(key, (keyframes.get(key) ?? []).concat(updatedKeyframes));
			options.set(key, (options.get(key) ?? []).concat(optionEntry));
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
		...getOtherStateRelatedEntries(),
	};
};
