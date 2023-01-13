import {
	BewegungsOptions,
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	ExpandEntry,
	Selector,
	WorkerState,
} from "../types";

export const initalState = (): WorkerState => ({
	//main element state
	keyframes: new Map<string, CustomKeyframe[]>(),
	options: new Map<string, BewegungsOptions[]>(),
	selectors: new Map<string, [CustomKeyframe[], BewegungsOptions]>(),
	//all element state
	root: new Map<string, string>(),
	parent: new Map<string, string>(),
	affectedBy: new Map<string, string[]>(),
	ratio: new Map<string, number>(),
	type: new Map<string, EntryType>(),
	//context
	totalRuntime: 0,
	changeProperties: [],
	changeTimings: [0, 1],
	//keyframe related
	remainingKeyframes: 0,
	appliableKeyframes: [],
	readouts: new Map<string, ElementReadouts[]>(),
});

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
