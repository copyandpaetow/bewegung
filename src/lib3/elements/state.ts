import { Timeline } from "../animate/calculate-timeline";
import { Callbacks, Chunks } from "../types";
import { calculateContext } from "./context";
import { saveMainElements } from "./getters";
import {
	setOptions,
	setKeyframes,
	setCallbacks,
	setSecondaryElements,
} from "./setters";

export const state_mainElements = new Set<HTMLElement>();
export const state_affectedElements = new Set<HTMLElement>();

export let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
export let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
export let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
export let state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();

export const setState = (chunks: Chunks[]) => {
	cleanup();
	calculateContext(chunks);

	chunks.forEach((element) =>
		element.target.forEach((mainElement) => state_mainElements.add(mainElement))
	);
	chunks.forEach((chunk) => {
		setOptions(chunk);
		setKeyframes(chunk);
		setCallbacks(chunk);
		setSecondaryElements(chunk);
	});
	saveMainElements();
	return;
};

const cleanup = () => {
	state_mainElements.clear();
	state_affectedElements.clear();
	state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
	state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
	state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
	state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();
};

/*
const chunkMap = new Map([[ChunkID1, Chunk], [ChunkID2, Chunk], [ChunkID3, Chunk])
const chunkKeys = new WeakMap<HTMLElment, [ chunkID1,  chunkID3]>

0. for each chunk, set it to the chunk map with a uniqueID (like Symbol("chunk")). 
	 For each chunk target element, set it into a weakmap with the chunkID. 
	 If the element is already present, add to the chunk IDs

const keyframes = chunkKeys.get(element).flatMap(chunkID => chunkMap.get(chunkID).keyframes)

1. lookup in with chunks the current element is participating in (via an ID)
2. get all related keyframes

*/
