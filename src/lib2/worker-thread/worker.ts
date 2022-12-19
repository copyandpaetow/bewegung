import { defaultOptions } from "../constants";
import {
	BewegungsOptions,
	CustomKeyframe,
	ElementEntry,
	ElementReadouts,
	QueryFunctions,
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
	changeTimings: [],

	totalRuntime: defaultOptions.duration as number,
	appliableKeyframes: [],
	resultingStyleChange: new Map(),
	readouts: new Map(),
	lookup: new Map(),
	rootElements: new Set(),
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

const queryFunctions: QueryFunctions = {
	normalizePropsInWorker(transferObject: TransferObject) {
		const options = normalizeOptions(transferObject.options);
		const totalRuntime = (workerState.totalRuntime = calculateTotalRuntime(options));
		const keyframes = normalizeKeyframes(transferObject.keyframes, options, totalRuntime);
		const changeTimings = (workerState.changeTimings = calculateChangeTimings(keyframes));

		reply("sendKeyframeInformationToClient", {
			changeTimings,
			changeProperties: calculateChangeProperties(keyframes),
			totalRuntime: workerState.totalRuntime,
		});
		fillWorkerState(transferObject.targets, keyframes, options);

		const appliableKeyframes = calculateAppliableKeyframes(workerState);

		workerState.appliableKeyframes = appliableKeyframes;
		workerState.resultingStyleChange = appliableKeyframes.at(-1)!;
	},

	sendElementLookup(elementLookup: Map<string, ElementEntry>) {
		const rootElements = new Set<string>();

		elementLookup.forEach((entry) => rootElements.add(entry.root));

		workerState.lookup = elementLookup;
		workerState.rootElements = rootElements;
	},

	requestAppliableKeyframes() {
		reply("sendAppliableKeyframes", {
			keyframes: workerState.appliableKeyframes.pop(),
			done: workerState.appliableKeyframes.length === 0,
		});
	},
	sendReadouts(newReadout: Map<string, ElementReadouts>) {
		newReadout.forEach((readout, elementString) => {
			workerState.readouts.set(
				elementString,
				[readout].concat(workerState.readouts.get(elementString) ?? [])
			);
		});

		if (workerState.appliableKeyframes.length > 0) {
			reply("sendAppliableKeyframes", {
				keyframes: workerState.appliableKeyframes.pop(),
				done: workerState.appliableKeyframes.length === 0,
			});
			return;
		}

		filterReadouts(workerState);

		const finalKeyframes = constructKeyframes(workerState);
		reply("sendKeyframes", finalKeyframes);
	},
};
