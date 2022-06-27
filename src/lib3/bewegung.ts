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

	//upcoming problems
	//TODO: the same element could be in different chunks for different animation (animate rotate/opacity separatly)
	logCalculationTime(start);

	return {
		play: () => {
			applyStyles();
			waapi.forEach((animation) => animation.play());
		},
		pause: () => waapi.forEach((animation) => animation.pause()),
	};
};
