import { MainMessages, TimelineEntry, WorkerMessages } from "./types";
import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let state = {
	dimensions: new Map<number, Map<string, Partial<CSSStyleDeclaration>>>(),
	parents: new Map<string, string>(),
	easings: new Map<string, Set<TimelineEntry>>(),
	ratios: new Map<string, number>(),
	types: new Set<string>(),
};

workerAtom("sendState").onMessage((stateTransferable) => {
	state = {
		...stateTransferable,
		dimensions: new Map<number, Map<string, Partial<CSSStyleDeclaration>>>(),
	};
});

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { changes, done, start } = domChanges;
	state.dimensions.set(start, changes);

	if (done) {
		console.log(state);
		//workerAtom("sendAnimations").reply("animations", new Map<string, CSSStyleDeclaration>());
	}
});

/*
	What do we need

	- dimensions
	- easings for the timeline => options
	- parent/root/sibling relations for the calculations
	- images or ratios


*/
