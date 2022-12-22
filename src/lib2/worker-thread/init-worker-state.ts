import { defaultOptions } from "../constants";
import {
	BewegungsOptions,
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	ExpandEntry,
	WorkerState,
} from "../types";

export const expandEntry: ExpandEntry = (allTargets: string[][], entry: any) => {
	const result = new Map<string, any>();

	allTargets.forEach((currentTarget, index) => {
		const currentEntry = entry[index];

		currentTarget.forEach((target) => {
			result.set(target, (result.get(target) ?? []).concat(currentEntry));
		});
	});
	return result;
};

export const initWorkerState = (): WorkerState => ({
	changeTimings: [0, 1],
	keyframes: new Map<string, CustomKeyframe[]>(),
	options: new Map<string, BewegungsOptions[]>(),
	appliableKeyframes: [],
	totalRuntime: defaultOptions.duration as number,
	resultingStyleChange: new Map<string, CustomKeyframe>(),
	readouts: new Map<string, ElementReadouts[]>(),
	lookup: new Map<string, ElementEntry>(),
	rootElements: new Set<string>(),
});
