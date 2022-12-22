import {
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	QueryFunctions,
	Replies,
	TransferObject,
	ValueOf,
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

const sendKeyframes = (appliableKeyframes: Map<string, CustomKeyframe>[]) => {
	if (appliableKeyframes.length === 0) {
		return false;
	}
	reply("sendAppliableKeyframes", {
		keyframes: appliableKeyframes.pop()!,
		done: appliableKeyframes.length === 0,
	});
	return true;
};

let workerState = initWorkerState();

const queryFunctions: QueryFunctions = {
	initWorkerState(transferObject: TransferObject) {
		const options = normalizeOptions(transferObject.options);
		const totalRuntime = calculateTotalRuntime(options);
		const keyframes = normalizeKeyframes(transferObject.keyframes, options, totalRuntime);
		const changeTimings = calculateChangeTimings(keyframes);

		reply("sendKeyframeInformationToClient", {
			changeTimings,
			changeProperties: calculateChangeProperties(keyframes),
			totalRuntime: totalRuntime,
		});
		const keyframeMap = expandEntry(transferObject.targets, keyframes);
		const appliableKeyframes = calculateAppliableKeyframes(keyframeMap, changeTimings);

		workerState = {
			...workerState,
			changeTimings,
			keyframes: keyframeMap,
			options: expandEntry(transferObject.targets, options),
			appliableKeyframes,
			totalRuntime,
			resultingStyleChange: appliableKeyframes.at(-1)!,
		};
	},

	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		const rootElements = new Set<string>();

		elementLookup.forEach((entry) => rootElements.add(entry.root));

		workerState.lookup = elementLookup;
		workerState.rootElements = rootElements;
	},

	requestAppliableKeyframes() {
		sendKeyframes(workerState.appliableKeyframes);
	},

	sendReadouts(newReadout: Map<string, ElementReadouts>) {
		const areThereMoreKeyframes = sendKeyframes(workerState.appliableKeyframes);
		newReadout.forEach((readout, elementString) => {
			const allReadouts = workerState.readouts.get(elementString);
			if (!allReadouts) {
				workerState.readouts.set(elementString, [readout]);
				return;
			}

			workerState.readouts.set(elementString, [readout].concat(allReadouts!));
		});

		if (areThereMoreKeyframes) {
			return;
		}

		const finalKeyframes = constructKeyframes(workerState);
		reply("sendKeyframes", finalKeyframes);
	},
};
