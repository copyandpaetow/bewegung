import { calculate } from "../calculate/calculate";
import { Callbacks, Chunks, Context } from "../types";
import { calculateContext } from "./context";
import { findAffectedDOMElements } from "./find-affected";

const chunkMap = new Map<symbol, Chunks>();
let chunkKeys = new WeakMap<HTMLElement, symbol[]>();
export let state_originalStyle = new WeakMap<HTMLElement, string>();
export const state_mainElements = new Set<HTMLElement>();
export const state_affectedElements = new Set<HTMLElement>();
export let state_dependencyElements = new WeakMap<
	HTMLElement,
	Set<HTMLElement>
>();

export let state_context: Context;

const cleanup = () => {
	chunkMap.clear();
	state_mainElements.clear();
	state_affectedElements.clear();
	chunkKeys = new WeakMap<HTMLElement, symbol[]>();
	state_originalStyle = new WeakMap<HTMLElement, string>();
	state_dependencyElements = new WeakMap<HTMLElement, Set<HTMLElement>>();
};

const chunkLens = (type: keyof Chunks) => (element: HTMLElement) =>
	chunkKeys
		.get(element)!
		.map((chunkKey) => chunkMap.get(chunkKey)![type])
		.flat();

export const getKeyframes = chunkLens("keyframes") as (
	element: HTMLElement
) => ComputedKeyframe[];

export const getOptions = chunkLens("options") as (
	element: HTMLElement
) => ComputedEffectTiming[];

export const getCallbacks = chunkLens("callbacks") as (
	element: HTMLElement
) => Callbacks[];

const addAffectedElements = (mainElements: Set<HTMLElement>) =>
	mainElements.forEach((element) => {
		findAffectedDOMElements(element).forEach((affectedElement) => {
			if (state_mainElements.has(affectedElement)) {
				return;
			}
			state_affectedElements.add(affectedElement);
			state_dependencyElements.set(
				affectedElement,
				(state_dependencyElements.get(affectedElement) || new Set()).add(
					element
				)
			);
		});
	});

const updateKeyframeTiming = (
	frame: ComputedKeyframe | Callbacks,
	options: ComputedEffectTiming,
	totalRuntime: number
) => {
	const { delay: start, endTime } = options;

	const absoluteTiming =
		//@ts-expect-error stupid typescript
		(endTime! * (frame.offset || frame.computedOffset) + start!) / totalRuntime;

	return {
		...frame,
		offset: absoluteTiming,
	};
};

export const prepare = (chunks: Chunks[]) => {
	cleanup();
	state_context = Object.freeze(calculateContext(chunks));
	const { totalRuntime } = state_context;

	chunks.forEach((chunk) => {
		const { callbacks, keyframes, options, target } = chunk;
		const updatedKeyframes = keyframes.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		) as ComputedKeyframe[];
		const updatedCallbacks = callbacks?.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		) as Callbacks[];

		const key = Symbol("chunkKey");
		chunkMap.set(key, {
			...chunk,
			keyframes: updatedKeyframes,
			callbacks: updatedCallbacks ?? null,
		});
		target.forEach((element) => {
			state_mainElements.add(element);
			state_originalStyle.set(element, element.style.cssText);
			chunkKeys.set(element, [...(chunkKeys.get(element) || []), key]);
		});
	});

	chunks.forEach((chunk) => addAffectedElements(chunk.target));

	return calculate();
};
