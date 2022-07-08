import { normalizeElement } from "../../lib/core/dom-normalize-element";
import { arrayifyInputs, formatKeyFrames } from "./normalize";
import {
	Callbacks,
	Chunks,
	CustomKeyframeEffect,
	VoidCallback,
} from "../types";
import { defaultOptions } from "../constants";

export const normalizeTarget = (
	input: CustomKeyframeEffect | KeyframeEffect
) => {
	return input instanceof KeyframeEffect
		? new Set([input.target] as HTMLElement[])
		: normalizeElement(input[0]);
};

export const normalizeKeyframes = (
	input: CustomKeyframeEffect | KeyframeEffect
) => {
	if (input instanceof KeyframeEffect) {
		return {
			keyframes: input.getKeyframes(),
			callbacks: null,
		};
	}
	const options = new KeyframeEffect(null, null, input[2] || defaultOptions);
	const easing = options.getComputedTiming().easing!;
	const composite = options.composite;

	const formattedKeyFrames = formatKeyFrames(input[1]);

	const callbacks: Callbacks[] = [];
	const keyframes: ComputedKeyframe[] = [];

	formattedKeyFrames.forEach((keyframe, index, array) => {
		//TODO: this offset calc is flawed / too simple
		//! if the offsets are 0.5, x, y it would make 0.5, 0.66, 1 and not 0.5, 0.75, 1
		const offset =
			keyframe.offset || isNaN(index / (array.length - 1))
				? 1
				: index / (array.length - 1);

		const { callback, ...styles } = keyframe;
		if (callback) {
			callbacks.push({ callback, offset });
		}
		keyframes.push({
			offset,
			computedOffset: offset,
			easing,
			composite,
			...styles,
		});
	});

	return {
		keyframes,
		callbacks,
	};
};

export const normalizeOptions = (
	input: CustomKeyframeEffect | KeyframeEffect
) => {
	return input instanceof KeyframeEffect
		? input.getComputedTiming()
		: new KeyframeEffect(
				null,
				null,
				input[2] || defaultOptions
		  ).getComputedTiming();
};

export const formatInputs = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): Chunks[] =>
	arrayifyInputs(animationInput).map((input) => {
		const target = normalizeTarget(input);
		const { keyframes, callbacks } = normalizeKeyframes(input);
		const options = normalizeOptions(input);
		//TODO: composite is missing

		const selector =
			input instanceof KeyframeEffect || typeof input[0] !== "string"
				? null
				: input[0];

		return { target, keyframes, callbacks, options, selector };
	});
