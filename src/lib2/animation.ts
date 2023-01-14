import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { saveOriginalStyle } from "./main-thread/css-resets";
import {
	compareRootElements,
	getGeneralTransferObject,
} from "./main-thread/find-affected-elements";
import { normalizeElements } from "./main-thread/normalize-elements";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/read-dom";
import { getRootSelector, initialMainState } from "./main-thread/state";
import { watchForChanges } from "./main-thread/watch-changes";
import { getOrAddKeyFromLookup } from "./shared/element-translations";
import { createMessageStore, createStore, getWorker } from "./shared/store";
import { BewegungProps, MainMessages, MainPatch, MainSchema, WorkerMessages } from "./types";
/*
TODOS:
 
# performance
- create a patch from the generalTransferObject and only send that
- maybe a "task" message loop could help to break up larger functions (only on the main thread)

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale
- to be somewhat side-effect free, the messageStore should be part of the stores state
- check for custom properties
- background images
- prefer reduced motion

#bugs
- if an animation which added images is paused and another animation is called, these images will get included and will have more images created for it
- all the main elements are also included in the GTO
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore
- the store.ts store is not perfectly typed
- the MO callback needs to be throtteled differently => their callback arguments would need to be saved somewhere or they are lost
- formatArraySyntax procudes wrong values when properties have mixed middle offsets but the same start and end values
*/

const allWorker = getWorker();

export const getAnimations = (props: BewegungProps) => {
	const messageStore = createMessageStore<MainMessages, WorkerMessages>(allWorker.current(), {
		cache: {},
		sendMainTransferObject({ reply }, mainTransferObject) {
			reply("receiveMainState", mainTransferObject);
		},
		sendMainTransferPatch({ reply }, patches) {
			reply("receiveMainStatePatches", patches);
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
			console.log(constructedKeyframes);
			store.dispatch("sendKeyframes", constructedKeyframes);
		},
	});

	const store = createStore<MainSchema>({
		state: initialMainState(),
		methods: {
			setMainTransferObject({ state }, initialProps) {
				const { mainTransferObject, elementRoots, elementResets, elementSelectors } = state;

				unifyPropStructure(initialProps).forEach((entry, index) => {
					const [targets, keyframes, options] = entry;

					const root = getRootSelector(options);

					elementSelectors[index] = typeof targets === "string" ? targets : "";
					const htmlElements = normalizeElements(targets);

					const elementKeys = htmlElements.map((element) => {
						elementResets.set(element, saveOriginalStyle(element));
						elementRoots.set(element, compareRootElements(root, elementRoots.get(element)));

						return getOrAddKeyFromLookup(element, state.elementTranslation);
					});

					mainTransferObject._keys[index] = elementKeys;
					mainTransferObject.keyframes[index] = keyframes;
					mainTransferObject.options[index] = options;
				});
			},
			updateMainTransferObject({ state }, patches) {
				const { mainTransferObject, elementTranslation } = state;

				patches.forEach((patch) => {
					if (patch.op === "+") {
						patch.indices?.forEach((patchIndex) => {
							mainTransferObject._keys[patchIndex].push(patch.key);
						});
						return;
					}
					elementTranslation.delete(patch.key);
					mainTransferObject._keys.forEach((exisitingKeys) => {
						const indexInExistingKeys = exisitingKeys.indexOf(patch.key);
						if (indexInExistingKeys === -1) {
							return;
						}
						exisitingKeys.splice(indexInExistingKeys, 1);
					});
				});
			},
		},
		actions: {
			initStateFromProps({ dispatch, commit, state }, initialProps) {
				commit("setMainTransferObject", initialProps);
				messageStore.send("sendMainTransferObject", state.mainTransferObject);

				dispatch("sendGeneralTransferObject");
			},
			patchMainState({ dispatch, commit, state }, patch) {
				const patches: MainPatch[] = [];
				patch.addedElements.forEach((entry) => {
					const key = getOrAddKeyFromLookup(entry[0], state.elementTranslation);
					patches.push({ op: "+", key, indices: entry[1] });
				});

				patch.removedElements.forEach((entry) => {
					const key = getOrAddKeyFromLookup(entry[0], state.elementTranslation);
					patches.push({ op: "-", key });
				});

				messageStore.send("sendMainTransferPatch", patches);
				commit("updateMainTransferObject", patches);

				dispatch("sendGeneralTransferObject");
			},
			async sendAppliableKeyframes({ state }, appliableKeyframes) {
				const { changeProperties, keyframes } = appliableKeyframes;
				const readouts = await readDom(keyframes, changeProperties, state);
				messageStore.send("sendReadout", readouts);
			},
			sendKeyframes({ state }, constructedKeyframes) {
				state.finishCallback(createAnimationsFromKeyframes(state, constructedKeyframes));
			},
			sendGeneralTransferObject({ state }) {
				messageStore.send("sendGeneralTransferObject", getGeneralTransferObject(state));
			},
		},
	});
	store.dispatch("initStateFromProps", props);

	return {
		getResults() {
			return store.state.result;
		},
		observe(before: VoidFunction, after: VoidFunction) {
			return watchForChanges(store, messageStore, [before, after]);
		},
	};
};
