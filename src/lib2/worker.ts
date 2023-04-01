import { createKeyframes } from "./create-keyframes";
import { ElementReadouts, MainMessages, TimelineEntry, WorkerMessages, WorkerState } from "./types";
import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let state: WorkerState = {
	dimensions: new Map<string, ElementReadouts[]>(),
	parents: new Map<string, string>(),
	easings: new Map<string, Set<TimelineEntry>>(),
	ratios: new Map<string, number>(),
	types: new Set<string>(),
};

workerAtom("sendState").onMessage((stateTransferable) => {
	state = {
		...stateTransferable,
		dimensions: new Map<string, ElementReadouts[]>(),
	};
});

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { changes, done } = domChanges;
	changes.forEach((readouts, elementID) => {
		state.dimensions.set(elementID, (state.dimensions.get(elementID) ?? []).concat(readouts));
	});

	if (done) {
		console.log(state);
		workerAtom("sendAnimations").reply("animations", createKeyframes(state));
	}
});
