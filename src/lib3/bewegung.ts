import { logCalculationTime } from "../lib/bewegung";
import { formatInputs } from "./inputs/format-inputs";
import { setState } from "./elements/state";
import { CustomKeyframeEffect } from "./types";
import { pauseAnimation, playAnimation } from "./animate/getters";

export const bewegung3 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();
	setState(formatInputs(...animationInput));

	/*
	upcoming tasks
	TODO: the same element could be in different chunks for different animation (animate rotate/opacity separatly)
	TODO: image aspect ratio and border-radius 
	?: does display: none work now? 
	TODO: reactivity for mutations, resizes, and positional Changes (IO)
	TODO: spans and text nodes

	in favor of tail-end calls. Depending on style or full recalc, just a different function has to be called
	*/

	logCalculationTime(start);

	return {
		play: () => playAnimation(),
		pause: () => pauseAnimation(),
	};
};
