import { createDefaultAnimation } from "./main-thread/create-default-animation";
import { createImageAnimation } from "./main-thread/create-image-animation";
import { saveOriginalStyle } from "./main-thread/css-resets";
import { getOrAddKeyFromLookup } from "./main-thread/element-translations";
import { setGeneralTransferObject } from "./main-thread/find-affected-elements";
import { normalizeElements } from "./main-thread/normalize-elements";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/read-dom";
import { getRootSelector, initialMainState, mainTransferObject } from "./main-thread/state";
import { createStore } from "./store";
import { BewegungProps, MainSchema } from "./types";

/*
TODOS:

# performance
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- improve the worker.ts main structure
- to avoid the wrong order of messages, we might need a queue 
- I think it would be nicer if we return a callback function that gets the current state of the animation instead of it being an array, which is sneakly updating

#bugs
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore

*/

const worker = new Worker(new URL("worker-thread/worker.ts", import.meta.url), {
	type: "module",
});

export const getAnimations = (props: BewegungProps) => {
	const store = createStore<MainSchema>(worker, {
		state: initialMainState(),
		methods: {
			setMainTransferObject({ state }, payload) {
				const newMainTransferObject = mainTransferObject();
				unifyPropStructure(payload).forEach((entry, index) => {
					const [targets, keyframes, options] = entry;

					const htmlElements = normalizeElements(targets);
					const elementKeys = htmlElements.map((element) => {
						state.cssResets.set(element, saveOriginalStyle(element));
						state.rootSelector.set(
							element,
							(state.rootSelector.get(element) ?? []).concat(getRootSelector(options))
						);

						return getOrAddKeyFromLookup(element, state.elementTranslation);
					});

					newMainTransferObject._keys[index] = elementKeys;
					newMainTransferObject.keyframes[index] = keyframes;
					newMainTransferObject.options[index] = options;
					newMainTransferObject.selectors[index] = typeof targets === "string" ? targets : "";
				});
				state.mainTransferObject = newMainTransferObject;
			},
			setGeneralTransferObject,
			setResults({ state }, payload) {
				const [imageKeyframes, defaultKeyframes, totalRuntime] = payload;
				const defaultAnimations = createDefaultAnimation(
					defaultKeyframes,
					state.elementTranslation,
					totalRuntime
				);
				const imageAnimations = createImageAnimation(imageKeyframes, state, totalRuntime);
				state.animations = [...defaultAnimations.animations, ...imageAnimations.animations];
				state.onStart = [...defaultAnimations.onStart, ...imageAnimations.onStart];
			},
		},
		actions: {
			initStateFromProps({ dispatch, commit }, payload) {
				commit("setMainTransferObject", payload);
				dispatch("replyMainTransferObject");
				commit("setGeneralTransferObject");
				dispatch("replyGeneralTransferObject");
			},
			async sendAppliableKeyframes({ dispatch, state }, payload) {
				const { changeProperties, keyframes } = payload;
				const readouts = await readDom(keyframes, changeProperties, state);
				dispatch("replyReadout", readouts);
			},
			sendKeyframes({ commit, state }, payload) {
				commit("setResults", payload);
				state.finishCallback({ animations: state.animations, onStart: state.onStart });
			},
			replyMainTransferObject({ state, reply }) {
				reply("updateMainState", state.mainTransferObject);
			},
			replyGeneralTransferObject({ state, reply }) {
				reply("updateGeneralState", state.generalTransferObject);
			},
			replyReadout({ reply }, payload) {
				reply("updateReadouts", payload);
			},
		},
	});

	store.dispatch("initStateFromProps", props);

	return store.state.result;
};
