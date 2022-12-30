import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { saveOriginalStyle } from "./main-thread/css-resets";
import { getOrAddKeyFromLookup } from "./shared/element-translations";
import { setGeneralTransferObject } from "./main-thread/find-affected-elements";
import { normalizeElements } from "./main-thread/normalize-elements";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/read-dom";
import { getRootSelector, initialMainState, mainTransferObject } from "./main-thread/state";
import { observeResizes } from "./main-thread/watch-resizes";
import { createStore, getWorker } from "./shared/store";
import { BewegungProps, MainSchema, WorkerSchema } from "./types";
import { observerDimensions } from "./main-thread/watch-dimensions";

/*
TODOS:

# performance


#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale

#bugs
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore
- the store.ts store is not perfectly typed
*/

const allWorker = getWorker();

export const getAnimations = (props: BewegungProps) => {
	const store = createStore<MainSchema, WorkerSchema>(allWorker.current(), {
		state: initialMainState(),
		methods: {
			setMainTransferObject({ state }, payload) {
				const newMainTransferObject = mainTransferObject();
				const newCssRest = new Map<HTMLElement, Map<string, string>>();
				const newRootSelectors = new Map<HTMLElement, string[]>();
				unifyPropStructure(payload).forEach((entry, index) => {
					const [targets, keyframes, options] = entry;

					const htmlElements = normalizeElements(targets);
					const elementKeys = htmlElements.map((element) => {
						newCssRest.set(element, saveOriginalStyle(element));
						newRootSelectors.set(
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
				state.rootSelector = newRootSelectors;
				state.cssResets = newCssRest;
			},
			setGeneralTransferObject,
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
			sendKeyframes({ state }, payload) {
				state.finishCallback(createAnimationsFromKeyframes(state, payload));
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
			replyRequestKeyframes({ reply }) {
				reply("requestKeyframes", undefined);
			},
		},
	});

	store.dispatch("initStateFromProps", props);

	/*
	for the MO - deleted element
	- get the deleted element.
	- if it is included within the keys of the MTO, delete that key and everything with that index
	- 
	*/

	const observe = (before: VoidFunction, after: VoidFunction) => {
		const callback = () => {
			before();
			store.dispatch("replyRequestKeyframes");
			after();
		};

		const unobserveRO = observeResizes(store.state, callback);
		const unobserveIO = observerDimensions(store.state, callback);

		return () => {
			unobserveRO();
			unobserveIO();
		};
	};

	return {
		getResults() {
			return store.state.result;
		},
		observe,
	};
};
