import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { saveOriginalStyle } from "./main-thread/css-resets";
import { setGeneralTransferObject } from "./main-thread/find-affected-elements";
import { normalizeElements } from "./main-thread/normalize-elements";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/read-dom";
import { getRootSelector, initialMainState, mainTransferObject } from "./main-thread/state";
import { observerDimensions } from "./main-thread/watch-dimensions";
import { observeResizes } from "./main-thread/watch-resizes";
import { getOrAddKeyFromLookup } from "./shared/element-translations";
import { createMessageStore, createStore, getWorker } from "./shared/store";
import { BewegungProps, MainMessages, MainSchema, WorkerMessages } from "./types";

/*
TODOS:

# performance
- if all entries in the GTO or the MTO are the same, maybe just use one then

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale
- maybe it makes more sense to separate the worker and reply from the store, so the store could be used in other instances like for the playstate

#bugs
- all the main elements are also included in the GTO
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore
- the store.ts store is not perfectly typed
*/

const allWorker = getWorker();

export const getAnimations = (props: BewegungProps) => {
	const messageStore = createMessageStore<MainMessages, WorkerMessages>(allWorker.current(), {
		sendMainTransferObject({ reply }, mainTransferObject) {
			reply("receiveMainState", mainTransferObject);
		},
		sendGeneralTransferObject({ reply }, generalTransferObject) {
			reply("receiveGeneralState", generalTransferObject);
		},
		sendReadout({ reply }, readouts) {
			reply("receiveReadouts", readouts);
		},
		sendRequestKeyframes({ reply }) {
			reply("receiveKeyframeRequest");
		},
		receiveAppliableKeyframes(_, appliableKeyframes) {
			store.dispatch("sendAppliableKeyframes", appliableKeyframes);
		},
		receiveConstructedKeyframes(_, constructedKeyframes) {
			store.dispatch("sendKeyframes", constructedKeyframes);
		},
	});

	const store = createStore<MainSchema>({
		state: initialMainState(),
		methods: {
			setMainTransferObject({ state }, initialProps) {
				const newMainTransferObject = mainTransferObject();
				const newCssRest = new Map<HTMLElement, Map<string, string>>();
				const newRootSelectors = new Map<HTMLElement, string[]>();
				unifyPropStructure(initialProps).forEach((entry, index) => {
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
			initStateFromProps({ commit, state }, initialProps) {
				commit("setMainTransferObject", initialProps);
				messageStore.send("sendMainTransferObject", state.mainTransferObject);
				commit("setGeneralTransferObject");
				messageStore.send("sendGeneralTransferObject", state.generalTransferObject);
				console.log(state.generalTransferObject);
			},
			patches({ dispatch, commit, state }, payload) {},
			async sendAppliableKeyframes({ state }, appliableKeyframes) {
				const { changeProperties, keyframes } = appliableKeyframes;
				const readouts = await readDom(keyframes, changeProperties, state);
				messageStore.send("sendReadout", readouts);
			},
			sendKeyframes({ state }, constructedKeyframes) {
				state.finishCallback(createAnimationsFromKeyframes(state, constructedKeyframes));
			},
			replyRequestKeyframes() {
				messageStore.send("sendRequestKeyframes", undefined);
			},
		},
	});
	store.dispatch("initStateFromProps", props);

	/*
	for the MO - deleted element
	- get the deleted element.
	- if it is included within the keys of the MTO, delete that key and everything with that index if it would close the keys array
	- 
	*/

	const observe = (before: VoidFunction, after: VoidFunction) => {
		let resizeIdleCallback: NodeJS.Timeout | undefined;

		const throttledCallback = () => {
			resizeIdleCallback && clearTimeout(resizeIdleCallback);
			resizeIdleCallback = setTimeout(() => {
				unobserve();
				before();
				store.dispatch("replyRequestKeyframes");
				after();
			}, 100);
		};

		const unobserveRO = observeResizes(store.state, throttledCallback);
		const unobserveIO = observerDimensions(store.state, throttledCallback);

		const unobserve = () => {
			unobserveRO();
			unobserveIO();
		};

		return unobserve;
	};

	return {
		getResults() {
			return store.state.result;
		},
		observe,
	};
};
