import { createStore } from "../store";
import { WorkerSchema } from "../types";
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

createStore<WorkerSchema>(self, {
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
		decreaseRemainingKeyframes({ state }) {
			state.remainingKeyframes = state.remainingKeyframes - 1;
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
		updateMainState({ commit, dispatch }, payload) {
			commit("setMainState", payload);
			dispatch("updateRemainingKeyframes");
		},
		updateGeneralState({ commit }, payload) {
			commit("setGeneralState", payload);
		},
		updateRemainingKeyframes({ commit, dispatch, state }) {
			const { remainingKeyframes } = state;

			if (remainingKeyframes) {
				commit("decreaseRemainingKeyframes");
				dispatch("replyAppliableKeyframes");
				return;
			}
			dispatch("replyConstructedKeyframes");
		},
		updateReadouts({ commit, dispatch }, payload) {
			commit("setReadouts", payload);
			dispatch("updateRemainingKeyframes");
		},
		replyConstructedKeyframes({ reply, state }) {
			reply("sendKeyframes", constructKeyframes(state));
		},
		replyAppliableKeyframes({ reply, state }) {
			const { appliableKeyframes, remainingKeyframes, changeProperties } = state;

			reply("sendAppliableKeyframes", {
				keyframes: appliableKeyframes[remainingKeyframes],
				changeProperties,
				done: remainingKeyframes === 0,
			});
		},
	},
});
