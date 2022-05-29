import { cssRuleName, CustomKeyframeEffect } from "./types";
import { arrayifyInputs, formatKeyFrames } from "../lib/core/normalize-inputs";
import { normalizeElement } from "../lib/core/dom-normalize-element";
import { CalculatedProperties } from "../lib/core/main-read-dimensions";
import {
	computed_changeTimings,
	computed_changingCSSProperties,
	dom_applyKeyframes,
	dom_reapplyOriginalStyle,
	mutation_addDOMInformation,
	mutation_addElementState,
	mutation_calculateDifferences,
	mutation_createWAAPI,
	mutation_updateKeyframes,
	play_animation,
	state_callbacks,
	state_keyframes,
	state_options,
	state_WAAPI,
} from "./state";
import { logCalculationTime } from "../lib/bewegung";

const defaults: Partial<KeyframeEffectOptions> = {
	duration: 400,
	easing: "ease",
};

const normalizeTarget = (input: CustomKeyframeEffect | KeyframeEffect) => {
	return input instanceof KeyframeEffect
		? ([input.target] as HTMLElement[])
		: normalizeElement(input[0]);
};

const normalizeKeyframes = (input: CustomKeyframeEffect | KeyframeEffect) => {
	if (input instanceof KeyframeEffect) {
		return {
			keyframes: input.getKeyframes(),
			callbacks: null,
		};
	}
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

const normalizeOptions = (input: CustomKeyframeEffect | KeyframeEffect) => {
	return input instanceof KeyframeEffect
		? input.getComputedTiming()
		: new KeyframeEffect(null, null, input[2] || defaults).getComputedTiming();
};

export const bewegung2 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();
	const targetElements = arrayifyInputs(animationInput).flatMap((input) => {
		const target = normalizeTarget(input);
		const { keyframes, callbacks } = normalizeKeyframes(input);
		const options = normalizeOptions(input);
		//TODO: composite is missing

		target.forEach((element) => {
			state_options.set(element, options);
			state_keyframes.set(element, keyframes);
			state_callbacks.set(element, callbacks);
		});

		return target;
	});
	mutation_addElementState(...targetElements);
	mutation_updateKeyframes();

	const changeProperties = computed_changingCSSProperties();

	computed_changeTimings().forEach((timing, index, array) => {
		// apply the keyframe styles to the main element
		dom_applyKeyframes(timing);
		// calculate the dimensions and change properties for all elements
		mutation_addDOMInformation(changeProperties);
		// reset on the last
		if (index === array.length - 1) {
			dom_reapplyOriginalStyle();
		}
	});

	mutation_calculateDifferences();

	mutation_createWAAPI();

	logCalculationTime(start);

	return {
		play: () => play_animation(),
	};
};
