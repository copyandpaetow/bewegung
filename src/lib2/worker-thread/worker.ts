import {
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	QueryFunctions,
	Replies,
	TransferObject,
	ValueOf,
	WorkerState,
} from "../types";
import {
	calculateAppliableKeyframes,
	calculateChangeProperties,
	calculateChangeTimings,
} from "./calculate-dom-changes";
import { calculateTotalRuntime } from "./calculate-runtime";
import { expandEntry, initWorkerState } from "./init-worker-state";
import { normalizeKeyframes } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";
import { constructKeyframes } from "./sort-keyframes";

const reply = (queryMethodListener: keyof Replies, ...queryMethodArguments: ValueOf<Replies>) => {
	postMessage({
		queryMethodListener,
		queryMethodArguments,
	});
};

onmessage = (event) => {
	const { queryMethod, queryMethodArguments } = event.data;

	const execute = queryFunctions[queryMethod];
	execute?.(...queryMethodArguments);
};

const sendKeyframes = (workerState: WorkerState) => {
	const { appliableKeyframes, remainingKeyframes, changeProperties } = workerState;
	const currentIndex = remainingKeyframes - 1;

	reply("sendAppliableKeyframes", {
		keyframes: appliableKeyframes[currentIndex],
		changeProperties,
		done: currentIndex === 0,
	});
	workerState.remainingKeyframes = currentIndex;
};

let workerState = initWorkerState();

const queryFunctions: QueryFunctions = {
	initWorkerState(transferObject: TransferObject) {
		const options = normalizeOptions(transferObject.options);
		const totalRuntime = calculateTotalRuntime(options);
		const keyframes = normalizeKeyframes(transferObject.keyframes, options, totalRuntime);
		const changeTimings = calculateChangeTimings(keyframes);
		const changeProperties = calculateChangeProperties(keyframes);

		const keyframeMap = expandEntry(transferObject.targets, keyframes);
		const appliableKeyframes = calculateAppliableKeyframes(keyframeMap, changeTimings);

		workerState = {
			...workerState,
			changeTimings,
			keyframes: keyframeMap,
			options: expandEntry(transferObject.targets, options),
			appliableKeyframes,
			totalRuntime,
			changeProperties,
		};

		queryFunctions.requestAppliableKeyframes();
	},

	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		const rootElements = new Set<string>();

		elementLookup.forEach((entry) => rootElements.add(entry.root));

		workerState.lookup = elementLookup;
		workerState.rootElements = rootElements;
	},

	requestAppliableKeyframes() {
		workerState.remainingKeyframes = workerState.appliableKeyframes.length;
		sendKeyframes(workerState);
	},

	sendReadouts(newReadout: Map<string, ElementReadouts>) {
		const remainingWork = workerState.remainingKeyframes > 0;
		console.log(workerState.remainingKeyframes, remainingWork);

		newReadout.forEach((readout, elementString) => {
			const allReadouts = workerState.readouts.get(elementString);
			if (!allReadouts) {
				workerState.readouts.set(elementString, [readout]);
				return;
			}

			workerState.readouts.set(elementString, [readout].concat(allReadouts!));
		});

		remainingWork
			? sendKeyframes(workerState)
			: reply("sendKeyframes", constructKeyframes(workerState));
	},
};
