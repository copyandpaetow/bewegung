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
} from "./calculate-dom-changes";
import { filterReadouts } from "./filter-readouts";
import { constructKeyframes } from "./sort-keyframes";
import { normalizeKeyframes } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";
import { calculateTotalRuntime } from "./calculate-runtime";
import { compareOffsetObjects } from "../utils";

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

const sendKeyframes = (appliableKeyframes: Map<string, CustomKeyframe>[]) => {
	if (appliableKeyframes.length === 0) {
		return false;
	}
	reply("sendAppliableKeyframes", {
		keyframes: appliableKeyframes.pop(),
		done: appliableKeyframes.length === 0,
	});
	return true;
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

			if (compareOffsetObjects(readout, allReadouts[0])) {
				return;
			}

			workerState.readouts.set(elementString, [readout].concat(allReadouts!));
		});

		if (areThereMoreKeyframes) {
			return;
		}

		filterReadouts(workerState);

		const finalKeyframes = constructKeyframes(workerState);
		reply("sendKeyframes", finalKeyframes);
	},
};
