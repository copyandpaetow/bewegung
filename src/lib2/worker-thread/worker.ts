import { createMessageStore } from "../shared/store";
import {
	BewegungsOptions,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	GeneralState,
	KeyframeState,
	MainElementState,
	MainMessages,
	WorkerMessages,
} from "../types";
import { constructKeyframes, deriveResultState } from "./sort-keyframes";
import { setMainState } from "./update-state";

//@ts-expect-error typescript doesnt
const worker = self as Worker;

const deriveKeyframeState = (
	appliableKeyframes: Map<number, Map<string, CustomKeyframe>>
): KeyframeState => ({
	remainingKeyframes: appliableKeyframes.values(),
	readouts: new Map<string, ElementReadouts[]>(),
});

const initGeneralState = (): GeneralState => ({
	affectedBy: new Map<string, string[]>(),
	parent: new Map<string, string>(),
	root: new Map<string, string>(),
	type: new Map<string, EntryType>(),
	ratio: new Map<string, number>(),
});

const initMainElementState = (): MainElementState => ({
	options: new Map<string, BewegungsOptions[]>(),
	totalRuntime: 0,
	changeTimings: [0, 1],
	changeProperties: new Set<CssRuleName>(),
	appliableKeyframes: new Map<number, Map<string, CustomKeyframe>>(),
});

//these could be promises maybe?
let mainElementState = initMainElementState();
let generalState = initGeneralState();
let keyframeState = deriveKeyframeState(mainElementState.appliableKeyframes);

createMessageStore<WorkerMessages, MainMessages>(worker, {
	replyAppliableKeyframes({ reply }) {
		const { changeProperties } = mainElementState;
		const { done, value: keyframes } = keyframeState.remainingKeyframes.next();

		if (done) {
			const resultState = deriveResultState(mainElementState, generalState, keyframeState);
			reply("receiveConstructedKeyframes", constructKeyframes(resultState));

			return;
		}

		reply("receiveAppliableKeyframes", {
			keyframes,
			changeProperties,
		});
	},
	receiveMainState({ send }, mainTransferables) {
		mainElementState = setMainState(mainTransferables);
		send("receiveKeyframeRequest");
	},
	receiveGeneralState(_, generalTransferable) {
		generalState = generalTransferable;
	},
	receiveReadouts({ send }, newReadouts) {
		newReadouts.forEach((readout, elementID) => {
			keyframeState.readouts.set(
				elementID,
				(keyframeState.readouts.get(elementID) ?? []).concat(readout)
			);
		});
		send("replyAppliableKeyframes");
	},
	receiveKeyframeRequest({ send }) {
		keyframeState = deriveKeyframeState(mainElementState.appliableKeyframes);
		send("replyAppliableKeyframes");
	},
});
