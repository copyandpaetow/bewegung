import { logCalculationTime } from "../lib/bewegung";
import { formatInputs } from "./format-inputs";
import { calculateContext } from "./helper/calculate-context";
import { animate, applyStyles, calculate, setState } from "./state";
import { CustomKeyframeEffect } from "./types";

export const bewegung3 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();
	const chunks = formatInputs(...animationInput);
	const { changeProperties, changeTimings, totalRuntime } =
		calculateContext(chunks);

	setState(chunks, totalRuntime);
	calculate(changeProperties, changeTimings);
	const waapi = animate(totalRuntime);

	/*
	upcoming tasks
	TODO: the same element could be in different chunks for different animation (animate rotate/opacity separatly)
	TODO: image aspect ratio and border-radius 
	?: does display: none work now? 
	TODO: reactivity for mutations, resizes, and positional Changes (IO)

	in favor of tail-end calls. Depending on style or full recalc, just a different function has to be called
	*/

	logCalculationTime(start);

	return {
		play: () => {
			applyStyles();
			waapi.forEach((animation) => animation.play());
		},
		pause: () => waapi.forEach((animation) => animation.pause()),
	};
};
