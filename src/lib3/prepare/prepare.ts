import { Callbacks, Chunks } from "../types";
import { calculateContext, Context } from "./context";
import { findAffectedDOMElements } from "./find-affected";

export const chunkMap = new Map<symbol, Chunks>();
export let chunkKeys = new WeakMap<HTMLElement, symbol[]>();
export let state_originalStyle = new WeakMap<HTMLElement, string>();
export const state_mainElements = new Set<HTMLElement>();
export const state_affectedElements = new Set<HTMLElement>();
export let state_dependencyElements = new WeakMap<
	HTMLElement,
	Set<HTMLElement>
>();

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

export const prepare = (chunks: Chunks[]) => {
	cleanup();
	calculateContext(chunks);
	const { totalRuntime } = Context;

	chunks.forEach((chunk) => {
		const newChunk = { ...chunk };

		const { callbacks, keyframes, options, target } = chunk;
		const updatedKeyframes = keyframes.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		);
		const updatedCallbacks = callbacks?.map((frame) =>
			updateKeyframeTiming(frame, options, totalRuntime)
		);
		newChunk.keyframes = updatedKeyframes as ComputedKeyframe[];
		newChunk.callbacks = (updatedCallbacks as Callbacks[]) ?? null;

		const key = Symbol("chunkKey");
		chunkMap.set(key, newChunk);
		target.forEach((element) => {
			state_mainElements.add(element);
			state_originalStyle.set(element, element.style.cssText);
			chunkKeys.set(element, [...(chunkKeys.get(element) || []), key]);
		});
	});

	chunks.forEach((chunk) => {
		chunk.target.forEach((element) => {
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
	});
};

const updateKeyframeTiming = (
	frame: ComputedKeyframe | Callbacks,
	options: ComputedEffectTiming,
	totalRuntime: number
) => {
	const { delay: start, duration: end, endDelay } = options;

	const absoluteTiming =
		//@ts-expect-error stupid typescript
		((end as number) * (frame.offset || frame.computedOffset) +
			(start as number) +
			endDelay!) /
		totalRuntime;

	return {
		...frame,
		offset: absoluteTiming,
	};
};
