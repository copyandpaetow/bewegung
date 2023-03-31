import { MainMessages, WorkerMessages } from "./types";
import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state = {
	dimensions: new Map<number, Map<string, DOMRect>>(),
	easings: new Map<number, Set<string>>(),
};

workerAtom("sendEasings").onMessage((easings) => {
	state.easings = easings;
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
