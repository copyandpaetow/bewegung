import { normalizeElement } from "../lib/core/dom-normalize-element";
import { arrayifyInputs, formatKeyFrames } from "./helper/normalize-inputs";
import { state_callbacks } from "./state/callbacks";
import { state_mainElements } from "./state/elements";
import { state_keyframes } from "./state/keyframes";
import { state_options } from "./state/options";
import { CustomKeyframeEffect } from "./types";

const defaults: Partial<KeyframeEffectOptions> = {
	duration: 400,
	easing: "ease",
};

export const normalizeTarget = (
	input: CustomKeyframeEffect | KeyframeEffect
) => {
	return input instanceof KeyframeEffect
		? ([input.target] as HTMLElement[])
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
	//TODO: it is costly to recalc that everytime, maybe init one once and set the timing again and again?
	const options = new KeyframeEffect(null, null, input[2] || defaults);
	const easing = options.getComputedTiming().easing;
	const composite = options.composite;

	const formattedKeyFrames = formatKeyFrames(input[1]);

	const callbacks = [];
	const keyframes = [];

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
//TODO: it is costly to recalc that everytime, maybe init one once and set the timing again and again?
export const normalizeOptions = (
	input: CustomKeyframeEffect | KeyframeEffect
) => {
	return input instanceof KeyframeEffect
		? input.getComputedTiming()
		: new KeyframeEffect(null, null, input[2] || defaults).getComputedTiming();
};

export const formatInputs = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) =>
	arrayifyInputs(animationInput).forEach((input) => {
		const target = normalizeTarget(input);
		const { keyframes, callbacks } = normalizeKeyframes(input);
		const options = normalizeOptions(input);
		//TODO: composite is missing

		target.forEach((element) => {
			state_mainElements.add(element);
			state_options.set(element, options);
			state_keyframes.set(element, keyframes);
			state_callbacks.set(element, callbacks);
		});
	});