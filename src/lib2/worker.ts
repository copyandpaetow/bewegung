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
	const { changes, end } = domChanges;
	state.dimensions.set(end, changes);

	if (end === 1) {
		console.log(state);
		//workerAtom("sendAnimations").reply("animations", new Map<string, CSSStyleDeclaration>());
	}
});

/*
	What do we need

	- dimensions
	- easings for the timeline
	- parent/root/sibling relations for the calculations
	- images or ratios


*/
