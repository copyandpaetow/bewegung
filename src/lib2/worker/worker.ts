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
	readouts: [],
	lookup: new Map(),
	sendKeyframes: 0,
	recievedKeyframes: 0,
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
		workerState.sendKeyframes = workerState.keyframes.size;
	},
	sendElements(elements: Map<string, string[]>) {
		workerState.elements = elements;
		workerState.appliableKeyframes = calculateAppliableKeyframes(workerState);

		reply("sendAppliableKeyframes", workerState.appliableKeyframes[workerState.sendKeyframes - 1]);
		workerState.sendKeyframes -= 1;
	},
	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		workerState.lookup = elementLookup;
	},
	sendReadouts(readout: Map<string, ElementReadouts>) {
		workerState.recievedKeyframes += 1;
		workerState.readouts.push(readout);

		getDomDifferences(workerState);

		if (workerState.sendKeyframes > 0) {
			reply(
				"sendAppliableKeyframes",
				workerState.appliableKeyframes[workerState.sendKeyframes - 1]
			);
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
