import { CustomKeyframeEffect } from "./types";
import { logCalculationTime } from "../lib/bewegung";
import {
	normalizeTarget,
	normalizeKeyframes,
	normalizeOptions,
} from "./format-inputs";
import { arrayifyInputs } from "./helper/normalize-inputs";
import { cleanup_animations, play_animation } from "./state/animation";
import { cleanup_calculations } from "./state/calculations";
import { cleanup_callbacks, mutate_callbacks } from "./state/callbacks";
import { cleanup_elements, mutate_mainElements } from "./state/elements";
import { cleanup_keyframes, mutate_keyframeState } from "./state/keyframes";
import { cleanup_options, mutate_options } from "./state/options";

const cleanup = () => {
	cleanup_elements();
	cleanup_options();
	cleanup_keyframes();
	cleanup_callbacks();
	cleanup_calculations();
	cleanup_animations();
};

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
