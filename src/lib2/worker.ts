import { calculateEasings } from "./calculations/easings";
import { createKeyframes } from "./create-keyframes";
import { EasingTable, ElementReadouts, MainMessages, WorkerMessages, WorkerState } from "./types";
import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let state: WorkerState = {
	dimensions: new Map<string, ElementReadouts[]>(),
	parents: new Map<string, string>(),
	easings: new Map<string, EasingTable>(),
	ratios: new Map<string, number>(),
	types: new Set<string>(),
};

workerAtom("sendState").onMessage((stateTransferable) => {
	state = {
		...state,
		...stateTransferable,
		easings: calculateEasings(stateTransferable.easings),
	};
});

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { changes, offset } = domChanges;

	if (offset === 0) {
		state.dimensions.clear();
	}

	changes.forEach((readouts, elementID) => {
		state.dimensions.set(elementID, (state.dimensions.get(elementID) ?? []).concat(readouts));
	});

	if (offset === 1) {
		console.log(state);
		workerAtom("sendAnimations").reply("animations", createKeyframes(state));
	}
});
