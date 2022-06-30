import { Chunks } from "../types";
import { Context } from "./context";
import { findAffectedDOMElements } from "./find-affected";
import {
	state_options,
	state_keyframes,
	state_callbacks,
	state_mainElements,
	state_affectedElements,
	state_affectedElementEasings,
} from "./state";

export const setOptions = (chunk: Chunks) => {
	const { target, options } = chunk;
	target.forEach((element) => state_options.set(element, options));
};

export const setKeyframes = (chunk: Chunks) => {
	const { totalRuntime } = Context;
	const { target, keyframes, options } = chunk;
	const { delay: start, duration: end, endDelay } = options;
	const updatedKeyframes = keyframes.map((frame) => {
		const absoluteTiming =
			((end as number) * (frame.offset || frame.computedOffset) +
				(start as number) +
				endDelay!) /
			totalRuntime;

		return {
			...frame,
			offset: absoluteTiming,
		};
	});
	target.forEach((element) => state_keyframes.set(element, updatedKeyframes));
};

export const setCallbacks = (chunk: Chunks) => {
	const { totalRuntime } = Context;
	const { target, callbacks, options } = chunk;
	const { delay: start, duration: end, endDelay } = options;
	const updatedCallbacks = callbacks?.map((frame) => {
		const absoluteTiming =
			((end as number) * frame.offset + (start as number) + endDelay!) /
			totalRuntime;

		return {
			...frame,
			offset: absoluteTiming,
		};
	});
	updatedCallbacks?.length &&
		target.forEach((element) => state_callbacks.set(element, updatedCallbacks));
};

export const setSecondaryElements = (chunk: Chunks) => {
	const { totalRuntime } = Context;
	const { target, options } = chunk;
	const { delay: start, duration: end, easing } = options;

	target.forEach((element) => {
		findAffectedDOMElements(element).forEach((affectedElement) => {
			if (state_mainElements.has(affectedElement)) {
				return;
			}
			state_affectedElements.add(affectedElement);
			state_affectedElementEasings.set(
				affectedElement,
				Array.from([
					...(state_affectedElementEasings.get(affectedElement) || []),
					{
						start: (start as number) / totalRuntime,
						end: (end as number) / totalRuntime,
						easing: easing as string,
					},
				])
			);
		});
	});
};
