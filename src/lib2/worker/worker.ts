import { defaultOptions } from "../constants";
import {
	BewegungsOptions,
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	TransferObject,
	WorkerState,
} from "../types";
import {
	calculateChangeTimings,
	calculateChangeProperties,
	calculateAppliableKeyframes,
} from "./dom-preparations";
import { filterReadouts } from "./filter-readouts";
import { constructKeyframes } from "./keyframes";
import { normalizeKeyframes } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";
import { calculateTotalRuntime } from "./runtime";

const reply = (queryMethodListener: string, ...queryMethodArguments: any[]) => {
	if (!queryMethodListener) {
		throw new TypeError("reply - takes at least one argument");
	}
	postMessage({
		queryMethodListener,
		queryMethodArguments,
	});
};

onmessage = (event) => {
	const { queryMethod, queryMethodArguments } = event.data;

	if (!queryMethod || !queryMethodArguments) {
		return;
	}

	const execute = queryFunctions[queryMethod];

	execute?.(...queryMethodArguments);
};

const workerState: WorkerState = {
	keyframes: new Map<string, CustomKeyframe[]>(),
	options: new Map<string, BewegungsOptions[]>(),
	elements: new Map(),

	totalRuntime: defaultOptions.duration as number,
	appliableKeyframes: [],
	readouts: new Map(),
	lookup: new Map(),
};

const updateEntries = () => {
	filterReadouts(workerState);

	reply("sendKeyframes", constructKeyframes(workerState));
};

const fillWorkerState = (
	targets: string[][],
	keyframes: CustomKeyframe[][],
	options: BewegungsOptions[]
) => {
	targets.forEach((allTargets, index) => {
		const currentOption = options[index];
		const currentKeyframes = keyframes[index];

		allTargets.forEach((target) => {
			workerState.keyframes.set(
				target,
				(workerState.keyframes.get(target) ?? []).concat(currentKeyframes)
			);
			workerState.options.set(
				target,
				(workerState.options.get(target) ?? []).concat(currentOption)
			);
		});
	});
};

const queryFunctions = {
	normalizePropsInWorker(transferObject: TransferObject) {
		const options = normalizeOptions(transferObject.options);
		const totalRuntime = (workerState.totalRuntime = calculateTotalRuntime(options));
		const keyframes = normalizeKeyframes(transferObject.keyframes, options, totalRuntime);
		const changeTimings = calculateChangeTimings(keyframes);

		reply("sendKeyframeInformationToClient", {
			changeTimings,
			changeProperties: calculateChangeProperties(keyframes),
			totalRunetime: workerState.totalRuntime,
		});
		fillWorkerState(transferObject.targets, keyframes, options);

		workerState.appliableKeyframes = calculateAppliableKeyframes(changeTimings, workerState);
	},

	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		workerState.lookup = elementLookup;
		reply("sendAppliableKeyframes", workerState.appliableKeyframes.pop());
	},

	sendReadouts(newReadout: Map<string, ElementReadouts>) {
		newReadout.forEach((readout, elementString) => {
			workerState.readouts.set(
				elementString,
				(workerState.readouts.get(elementString) ?? []).concat(readout)
			);
		});

		if (workerState.appliableKeyframes.length > 0) {
			reply("sendAppliableKeyframes", workerState.appliableKeyframes.pop());

			return;
		}
		filterReadouts(workerState);
		reply("sendKeyframes", constructKeyframes(workerState));
	},
};
