import { createDefaultAnimation } from "./main-thread/create-default-animation";
import { createImageAnimation } from "./main-thread/create-image-animation";
import { saveOriginalStyle } from "./main-thread/css-resets";
import {
	findAffectedDOMElements,
	getRootElement,
	isImage,
	isTextNode,
} from "./main-thread/find-affected-elements";
import { normalizeElements } from "./main-thread/normalize-elements";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/read-dom";
import { getRatio } from "./main-thread/read-dom-properties";
import { getOrAddKeyFromLookup, getRootSelector } from "./main-thread/state";
import { createStore } from "./store";
import { BewegungProps, Result } from "./types";
import { BidirectionalMap } from "./utils";

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

export const getAnimations = (props: BewegungProps) => {
	const worker = new Worker(new URL("worker-thread/worker.ts", import.meta.url), {
		type: "module",
	});

	const store = createStore(worker, {
		state: {
			cssResets: new Map<HTMLElement, Map<string, string>>(),
			rootSelector: new Map<HTMLElement, string[]>(),
			mainTransferObject: {
				_keys: [],
				keyframes: [],
				options: [],
				selectors: [],
			},
			generalTransferObject: {
				_keys: [],
				root: [],
				parent: [],
				type: [],
				affectedBy: [],
				ratio: [],
			},
			elementTranslation: new BidirectionalMap<string, HTMLElement>(),
			onStart: [],
			animations: [],
			result: new Promise<Result>((resolve) => {}),
			finishPromise: () => {},
		},
		methods: {
			setPromise({ state }) {
				state.result = new Promise<Result>((resolve) => (state.finishPromise = resolve));
			},
			setMainTransferObject({ state }, payload) {
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

					state.mainTransferObject._keys[index] = elementKeys;
					state.mainTransferObject.keyframes[index] = keyframes;
					state.mainTransferObject.options[index] = options;
					state.mainTransferObject.selectors[index] = typeof targets === "string" ? targets : "";
				});
			},
			setGeneralTransferObject({ state }) {
				const getAffectedElementsMap = new Map<string, Set<string>>();
				const rootElements = new Map<string, HTMLElement>();
				const elementConnections = new Map<string, HTMLElement[]>();

				state.elementTranslation.forEach((domElement, elementString) => {
					const rootElement = getRootElement(state.rootSelector.get(domElement)!);
					rootElements.set(elementString, rootElement);

					elementConnections.set(elementString, findAffectedDOMElements(domElement, rootElement));
				});

				elementConnections.forEach((secondaryDomElements, mainElementString) => {
					secondaryDomElements.forEach((secondaryDomElement) => {
						const secondaryElementString = getOrAddKeyFromLookup(
							secondaryDomElement,
							state.elementTranslation
						);

						getAffectedElementsMap.set(
							secondaryElementString,
							(getAffectedElementsMap.get(secondaryElementString) ?? new Set<string>()).add(
								mainElementString
							)
						);
					});
				});

				state.elementTranslation.forEach((domElement, elementString) => {
					const elementType = isImage(domElement) || isTextNode(domElement) || "default";
					const affectedByMainElements = getAffectedElementsMap.get(elementString)!;

					const rootElement = getRootElement(
						Array.from(
							affectedByMainElements,
							(mainElementString: string) => rootElements.get(mainElementString)!
						)
					);

					state.generalTransferObject.root.push(state.elementTranslation.get(rootElement)!);
					state.generalTransferObject.parent.push(
						state.elementTranslation.get(domElement.parentElement!)!
					);
					state.generalTransferObject.type.push(elementType);
					state.generalTransferObject.affectedBy.push([...affectedByMainElements]);
					state.generalTransferObject.ratio.push(getRatio(domElement));
					state.generalTransferObject._keys.push(elementString);
				});
			},
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
				commit("setPromise");
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
				state.finishPromise({ animations: state.animations, onStart: state.onStart });
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
