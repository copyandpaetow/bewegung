import { createMessageStore, createStore } from "../shared/store";
import { MainMessages, WorkerMessages, WorkerSchema } from "../types";
import {
	calculateAppliableKeyframes,
	calculateChangeProperties,
	calculateChangeTimings,
} from "./calculate-dom-changes";
import { calculateTotalRuntime } from "./calculate-runtime";
import { expandEntry, initalState } from "./init-worker-state";
import { unifyKeyframeStructure } from "./normalize-keyframe-structure";
import { fillImplicitKeyframes, updateOffsets } from "./normalize-keyframes";
import { normalizeOptions } from "./normalize-options";
import { constructKeyframes } from "./sort-keyframes";

//@ts-expect-error typescript doesnt
const worker = self as Worker;

const messageStore = createMessageStore<WorkerMessages, MainMessages>(worker, {
	cache: {
		mainState: null,
	},
	replyConstructedKeyframes({ reply }, constructedKeyframes) {
		reply("receiveConstructedKeyframes", constructedKeyframes);
	},
	replyAppliableKeyframes({ reply }, appliableKeyframes) {
		reply("receiveAppliableKeyframes", appliableKeyframes);
	},
	receiveMainState({ cache }, mainState) {
		mainState.keyframes = mainState.keyframes
			.map(unifyKeyframeStructure)
			.map(fillImplicitKeyframes);
		mainState.options = normalizeOptions(mainState.options);
		cache.mainState = mainState;
		store.dispatch("updateMainState", mainState);
	},
	receiveMainStatePatches({ cache }, patches) {
		if (!cache.mainState) {
			throw new Error("no main state to patch");
		}
		patches.forEach((patch) => {
			if (patch.op === "+") {
				patch.indices?.forEach((patchIndex) => {
					cache.mainState!._keys[patchIndex].push(patch.key);
				});
				return;
			}
			cache.mainState!._keys.forEach((exisitingKeys) => {
				const indexInExistingKeys = exisitingKeys.indexOf(patch.key);
				if (indexInExistingKeys === -1) {
					return;
				}
				exisitingKeys.splice(indexInExistingKeys, 1);
			});
		});
		store.dispatch("updateMainState", cache.mainState);
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
			const { _keys, keyframes, options } = transferObject;
			state.totalRuntime = calculateTotalRuntime(options);
			const updatedKeyframes = keyframes.map((keyframeEntries, index) =>
				updateOffsets(keyframeEntries, options[index], state.totalRuntime)
			);
			state.changeTimings = calculateChangeTimings(updatedKeyframes);
			state.changeProperties = calculateChangeProperties(updatedKeyframes);

			state.keyframes = expandEntry(_keys, updatedKeyframes);
			state.options = expandEntry(_keys, options);

			state.appliableKeyframes = calculateAppliableKeyframes(state.keyframes, state.changeTimings);
			state.remainingKeyframes = state.appliableKeyframes.length;
		},
		clearState({ state }) {
			state = initalState();
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
			commit("clearState");
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
