import { calculateEasings, getTimingsFromRoot } from "./default/easings";
import { getDefaultKeyframes } from "./default/keyframes";
import { createImageKeyframes } from "./images/keyframes";
import { getTextKeyframes } from "./texts/keyframes";
import {
	DefaultReadouts,
	EasingTable,
	ImageReadouts,
	MainMessages,
	TextReadouts,
	WorkerMessages,
	WorkerState,
} from "./types";
import { useWorker } from "./utils/use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let state: WorkerState = {
	textReadouts: new Map<string, TextReadouts[]>(),
	defaultReadouts: new Map<string, DefaultReadouts[]>(),
	imageReadouts: new Map<string, ImageReadouts[]>(),
	parents: new Map<string, string>(),
	easings: new Map<string, EasingTable>(),
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
	const { textChanges, imageChanges, defaultChanges, offset } = domChanges;
	const { textReadouts, defaultReadouts, imageReadouts, timings } = state;

	if (offset === 0) {
		textReadouts.clear();
		defaultReadouts.clear();
		imageReadouts.clear();
		timings.length = 0;
	}

	defaultChanges.forEach((readouts, elementID) => {
		defaultReadouts.set(elementID, (defaultReadouts.get(elementID) ?? []).concat(readouts));
	});

	textChanges.forEach((readouts, elementID) => {
		textReadouts.set(elementID, (textReadouts.get(elementID) ?? []).concat(readouts));
	});
	imageChanges.forEach((readouts, elementID) => {
		imageReadouts.set(elementID, (imageReadouts.get(elementID) ?? []).concat(readouts));
	});

	state.timings.push(offset);
	if (offset === 1) {
		workerAtom("sendDefaultResults").reply("defaultResults", getDefaultKeyframes(state));
		workerAtom("sendImageResults").reply("imageResults", createImageKeyframes(state));
		workerAtom("sendTextResults").reply("textResults", getTextKeyframes(state));
	}
});
