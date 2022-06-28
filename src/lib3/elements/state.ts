import { Timeline } from "../animate/calculate-timeline";
import { calculate } from "../calculate/state";
import { Callbacks, Chunks } from "../types";
import { calculateContext } from "./context";
import { setMainElements } from "./getters";
import {
	setOptions,
	setKeyframes,
	setCallbacks,
	setMainELements,
	setSecondaryElements,
} from "./setters";

export const state_mainElements: Set<HTMLElement>[] = [];
export const state_affectedElements = new Set<HTMLElement>();

export let state_selectors = new WeakMap();
export let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
export let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
export let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
export let state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();

export const setState = (chunks: Chunks[]) => {
	calculateContext(chunks);
	const mainElements = new Set(chunks.flatMap((element) => element.target));
	chunks.forEach((chunk) => {
		setOptions(chunk);
		setKeyframes(chunk);
		setCallbacks(chunk);
		setMainELements(chunk);
		setSecondaryElements(mainElements)(chunk);
	});
	setMainElements();
	return calculate();
};

/*
	initial adding of elements => chunks

	after that as callback from the Mutation observer
	worst case not in one go but a lot of elements after each other
	these could go in a stack (FILO) and on every requestIdleCallback/queueMicrotask 
	
	after chunk removals to the state_mainElements 
	- timing, keyframes and runtime need to get recalculated
	- keyframes, callbacks need to be adjusted
	- affected elements


	*/
