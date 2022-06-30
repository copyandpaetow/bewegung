import { Timeline } from "../animate/calculate-timeline";
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

export let state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
export let state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
export let state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
export let state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();

export const setState = (chunks: Chunks[]) => {
	cleanup();
	calculateContext(chunks);
	const mainElements = new Set<HTMLElement>();
	chunks.forEach((element) =>
		element.target.forEach((mainElement) => mainElements.add(mainElement))
	);
	chunks.forEach((chunk) => {
		setOptions(chunk);
		setKeyframes(chunk);
		setCallbacks(chunk);
		setMainELements(chunk);
		setSecondaryElements(mainElements)(chunk);
	});
	setMainElements();
	return;
};

const cleanup = () => {
	state_mainElements.length = 0;
	state_affectedElements.clear();
	state_options = new WeakMap<HTMLElement, ComputedEffectTiming>();
	state_keyframes = new WeakMap<HTMLElement, ComputedKeyframe[]>();
	state_callbacks = new WeakMap<HTMLElement, Callbacks[]>();
	state_affectedElementEasings = new WeakMap<HTMLElement, Timeline>();
};
