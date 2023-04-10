import { calculateEasings, getTimingsFromRoot } from "./calculations/easings";
import { createKeyframes } from "./create-keyframes";
import { normalizeProps } from "./normalize-props";
import { EasingTable, ElementReadouts, MainMessages, WorkerMessages, WorkerState } from "./types";
import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let state: WorkerState = {
	readouts: new Map<string, ElementReadouts[]>(),
	defaultReadouts: new Map<string, ElementReadouts[]>(),
	imageReadouts: new Map<string, ElementReadouts[]>(),
	parents: new Map<string, string>(),
	easings: new Map<string, EasingTable>(),
	textElements: new Set<string>(),
	timings: [],
	options: [],
};

workerAtom("sendState").onMessage((stateTransferable) => {
	state = {
		...state,
		...stateTransferable,
		easings: calculateEasings(getTimingsFromRoot(stateTransferable)),
	};
});

workerAtom("sendStateUpdate").onMessage((parentUpdate) => {
	parentUpdate.forEach((parent, current) => {
		state.parents.set(current, parent);
	});
	calculateEasings(getTimingsFromRoot({ parents: state.parents, options: state.options })).forEach(
		(easings, key) => {
			state.easings.set(key, easings);
		}
	);
});

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { changes, offset } = domChanges;

	if (offset === 0) {
		state.readouts.clear();
		state.imageReadouts.clear();
		state.timings = [];
	}

	changes.forEach((readouts, elementID) => {
		state.readouts.set(elementID, (state.readouts.get(elementID) ?? []).concat(readouts));
	});
	state.timings.push(offset);
	if (offset === 1) {
		workerAtom("sendResults").reply("results", createKeyframes(state));
	}
});
