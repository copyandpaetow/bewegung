import { createMessageStore } from "../shared/store";
import { CustomKeyframe, MainMessages, WorkerMessages, WorkerState } from "../types";
import { constructKeyframes } from "./sort-keyframes";
import { setMainState } from "./update-state";

//@ts-expect-error typescript doesnt
const worker = self as Worker;

let state: WorkerState;
let remainingKeyframes: IterableIterator<Map<string, CustomKeyframe>>;

createMessageStore<WorkerMessages, MainMessages>(worker, {
	replyAppliableKeyframes({ reply }) {
		const { changeProperties } = state;
		const { done, value: keyframes } = remainingKeyframes.next();

		if (done) {
			queueMicrotask(() => {
				reply("receiveConstructedKeyframes", constructKeyframes(state));
			});
			return;
		}

		reply("receiveAppliableKeyframes", {
			keyframes,
			changeProperties,
		});
	},
	receiveMainState({ send }, mainTransferables) {
		state = Object.freeze(setMainState(mainTransferables));
		send("receiveKeyframeRequest");
	},
	receiveGeneralState(_, generalState) {
		state = Object.freeze({ ...state, ...generalState });
	},
	receiveReadouts({ send }, readouts) {
		send("replyAppliableKeyframes");
		readouts.forEach((readout, elementString) => {
			state.readouts.set(elementString, (state.readouts.get(elementString) ?? []).concat(readout));
		});
	},
	receiveKeyframeRequest({ send }) {
		remainingKeyframes = state.appliableKeyframes.values();
		send("replyAppliableKeyframes");
	},
});
