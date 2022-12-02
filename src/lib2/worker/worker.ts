import { defaultOptions } from "../constants";
import { getDomDifferences } from "../read/dimension-differences";
import {
	BewegungsOptions,
	CssRuleName,
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	WorkerState,
} from "../types";
import {
	calculateAppliableKeyframes,
	calculateChangeProperties,
	calculateChangeTimings,
} from "./dom-preparations";
import { filterReadouts } from "./filter-readouts";
import { constructKeyframes } from "./keyframes";
import { calculateTotalRuntime } from "./runtime";
import { updateKeyframeOffsets } from "./update-offsets";

const reply = (queryMethodListener: string, ...queryMethodArguments: any[]) => {
	if (!queryMethodListener) {
		throw new TypeError("reply - takes at least one argument");
	}
	postMessage({
		queryMethodListener,
		queryMethodArguments,
	});
};

const workerState: WorkerState = {
	keyframes: new Map(),
	options: new Map(),
	elements: new Map(),
	changeTimings: [],
	totalRuntime: defaultOptions.duration as number,
	appliableKeyframes: [],
	readouts: new Map(),
	lookup: new Map(),
	sendKeyframes: 0,
	recievedKeyframes: 0,
};

const updateEntries = () => {
	filterReadouts(workerState);

	reply("sendKeyframes", constructKeyframes(workerState));
};

const queryFunctions = {
	init() {
		console.log("started");
	},
	sendKeyframes(keyframes: Map<string, CustomKeyframe[]>) {
		workerState.keyframes = keyframes;
		reply("sendChangeProperties", calculateChangeProperties(keyframes));
	},
	sendOptions(options: Map<string, BewegungsOptions>) {
		workerState.options = options;
		workerState.totalRuntime = calculateTotalRuntime(options);
		workerState.keyframes = updateKeyframeOffsets(workerState);
		workerState.changeTimings = calculateChangeTimings(workerState.keyframes);
	},
	sendElements(elements: Map<string, string[]>) {
		workerState.elements = elements;
		workerState.appliableKeyframes = calculateAppliableKeyframes(workerState);

		reply("sendAppliableKeyframes", workerState.appliableKeyframes[workerState.sendKeyframes]);
		workerState.sendKeyframes += 1;
	},
	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		workerState.lookup = elementLookup;
	},
	sendReadouts(newReadout: Map<string, ElementReadouts>) {
		workerState.recievedKeyframes += 1;
		newReadout.forEach((readout, elementString) => {
			workerState.readouts.set(
				elementString,
				(workerState.readouts.get(elementString) ?? []).concat(readout)
			);
		});

		if (workerState.sendKeyframes > workerState.keyframes.size - 1) {
			reply("sendAppliableKeyframes", workerState.appliableKeyframes[workerState.sendKeyframes]);
			workerState.sendKeyframes += 1;
		} else {
			updateEntries();
		}
	},
};

onmessage = (event) => {
	const { queryMethod, queryMethodArguments } = event.data;

	if (!queryMethod || !queryMethodArguments) {
		return;
	}

	const execute = queryFunctions[queryMethod];

	execute?.(...queryMethodArguments);
};
