import { defaultChangeProperties } from "../shared/constants";
import { createMessageStore } from "../shared/store";
import {
	BewegungsOptions,
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	MainMessages,
	WorkerMessages,
} from "../types";
import { constructKeyframes } from "./sort-keyframes";
import { setMainState } from "./update-state";

//@ts-expect-error typescript doesnt
const worker = self as Worker;

const state = {
	//main element state
	keyframes: new Map<string, CustomKeyframe[]>(),
	options: new Map<string, BewegungsOptions[]>(),
	//all element state
	root: new Map<string, string>(),
	parent: new Map<string, string>(),
	affectedBy: new Map<string, string[]>(),
	ratio: new Map<string, number>(),
	type: new Map<string, EntryType>(),
	//context
	totalRuntime: 0,
	changeProperties: [...defaultChangeProperties],
	changeTimings: [0, 1],
	//keyframe related
	remainingKeyframes: 0,
	appliableKeyframes: [],
	readouts: new Map<string, ElementReadouts[]>(),
};

createMessageStore<WorkerMessages, MainMessages>(worker, {
	replyAppliableKeyframes({ reply }) {
		const { appliableKeyframes, remainingKeyframes, changeProperties } = state;
		const done = remainingKeyframes === 0;

		if (done) {
			reply("receiveConstructedKeyframes", constructKeyframes(state));
			return;
		}

		reply("receiveAppliableKeyframes", {
			keyframes: appliableKeyframes[remainingKeyframes - 1],
			changeProperties,
			done,
		});

		state.remainingKeyframes -= 1;
	},
	receiveMainState({ send }, mainTransferables) {
		setMainState(state, mainTransferables);
		send("replyAppliableKeyframes");
	},
	receiveGeneralState(_, generalState) {
		state.root = generalState.root;
		state.parent = generalState.parent;
		state.affectedBy = generalState.affectedBy;
		state.ratio = generalState.ratio;
		state.type = generalState.type;
	},
	receiveReadouts({ send }, readouts) {
		readouts.forEach((readout, elementString) => {
			state.readouts.set(elementString, [readout].concat(state.readouts.get(elementString) ?? []));
		});
		send("replyAppliableKeyframes");
	},
	receiveKeyframeRequest({ send }) {
		state.remainingKeyframes = state.appliableKeyframes.length;
		send("replyAppliableKeyframes");
	},
});
