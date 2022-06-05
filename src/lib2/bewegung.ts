import { CustomKeyframeEffect } from "./types";
import { arrayifyInputs } from "../lib/core/normalize-inputs";
import { logCalculationTime } from "../lib/bewegung";
import {
	cleanup,
	mutate_callbacks,
	mutate_keyframeState,
	mutate_mainElements,
	mutate_options,
	play_animation,
} from "./state";
import {
	normalizeTarget,
	normalizeKeyframes,
	normalizeOptions,
} from "./format-inputs";

export const bewegung2 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();
	//TODO: maybe there could be a better place for this?
	cleanup();
	const targetElements = arrayifyInputs(animationInput).flatMap((input) => {
		const target = normalizeTarget(input);
		const { keyframes, callbacks } = normalizeKeyframes(input);
		const options = normalizeOptions(input);
		//TODO: composite is missing

		target.forEach((element) => {
			mutate_options(element, options, true);
			mutate_keyframeState(element, keyframes, true);
			mutate_callbacks(element, callbacks, true);
		});

		return target;
	});

	mutate_mainElements(...targetElements);

	logCalculationTime(start);

	return {
		play: () => play_animation(),
	};
};
