import { createMessageStore, createStore } from "../shared/store";
import { MainMessages, MainSchema, WorkerMessages, WorkerSchema } from "../types";
import {
	calculateAppliableKeyframes,
	calculateChangeProperties,
	calculateChangeTimings,
} from "./calculate-dom-changes";
import { calculateTotalRuntime } from "./calculate-runtime";
import { expandEntry, initalState } from "./init-worker-state";
import { normalizeKeyframes } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";
import { constructKeyframes } from "./sort-keyframes";

//@ts-expect-error typescript doesnt
const worker = self as Worker;

const messageStore = createMessageStore<WorkerMessages, MainMessages>(worker, {
	replyConstructedKeyframes({ reply }, constructedKeyframes) {
		reply("receiveConstructedKeyframes", constructedKeyframes);
	},
	replyAppliableKeyframes({ reply }, appliableKeyframes) {
		reply("receiveAppliableKeyframes", appliableKeyframes);
	},
	receiveMainState(_, mainState) {
		store.dispatch("updateMainState", mainState);
	},
	receiveGeneralState(_, generalState) {
		store.dispatch("updateGeneralState", generalState);
	},
	receiveReadouts(_, readouts) {
		store.dispatch("updateReadouts", readouts);
	},
	receiveKeyframeRequest() {
		store.dispatch("requestKeyframes");
	},
});

const store = createStore<WorkerSchema>({
	state: initalState(),
	methods: {
		setMainState({ state }, transferObject) {
			const options = normalizeOptions(transferObject.options);
			const totalRuntime = calculateTotalRuntime(options);
			const keyframes = normalizeKeyframes(transferObject.keyframes, options, totalRuntime);
			const changeTimings = calculateChangeTimings(keyframes);
			const changeProperties = calculateChangeProperties(keyframes);

			const keyframeMap = expandEntry(transferObject._keys, keyframes);
			const appliableKeyframes = calculateAppliableKeyframes(keyframeMap, changeTimings);

			state.appliableKeyframes = appliableKeyframes;
			state.changeTimings = changeTimings;
			state.changeProperties = changeProperties;
			state.keyframes = keyframeMap;
			state.options = expandEntry(transferObject._keys, options);
			state.remainingKeyframes = appliableKeyframes.length;
			state.selectors = expandEntry(transferObject._keys, [keyframes, options]);
			state.totalRuntime = totalRuntime;
		},
		setGeneralState({ state }, transferObject) {
			const { _keys, ...newState } = transferObject;

			Object.entries(newState).forEach(([property, value]) => {
				value.forEach((currentValue, index) => {
					state[property].set(_keys[index], currentValue);
				});
			});
		},
		updateRemainingKeyframes({ state }, payload) {
			state.remainingKeyframes = payload;
		},
		setReadouts({ state }, payload) {
			payload.forEach((readout, elementString) => {
				state.readouts.set(
					elementString,
					[readout].concat(state.readouts.get(elementString) ?? [])
				);
			});
		},
	},
	actions: {
		updateMainState({ commit, dispatch }, mainTransferObject) {
			commit("setMainState", mainTransferObject);
			dispatch("updateRemainingKeyframes");
		},
		updateGeneralState({ commit }, generalTransferObject) {
			commit("setGeneralState", generalTransferObject);
		},
		updateRemainingKeyframes({ commit, dispatch, state }) {
			const { remainingKeyframes } = state;

			if (remainingKeyframes) {
				commit("updateRemainingKeyframes", remainingKeyframes - 1);
				dispatch("sendCurrentKeyframe");
				return;
			}
			messageStore.send("replyConstructedKeyframes", constructKeyframes(state));
		},
		updateReadouts({ commit, dispatch }, readouts) {
			commit("setReadouts", readouts);
			dispatch("updateRemainingKeyframes");
		},
		requestKeyframes({ dispatch, commit, state }) {
			commit("updateRemainingKeyframes", state.appliableKeyframes.length);
			dispatch("sendCurrentKeyframe");
		},
		sendCurrentKeyframe({ state }) {
			const { appliableKeyframes, remainingKeyframes, changeProperties } = state;

			messageStore.send("replyAppliableKeyframes", {
				keyframes: appliableKeyframes[remainingKeyframes],
				changeProperties,
				done: remainingKeyframes === 0,
			});
		},
	},
});
