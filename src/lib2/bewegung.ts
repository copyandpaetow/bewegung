import { CustomKeyframeEffect } from "./types";
import { logCalculationTime } from "../lib/bewegung";
import { formatInputs } from "./format-inputs";
import {
	finishPromise,
	mutation_createWAAPI,
	pause_animation,
	play_animation,
} from "./state/animation";
import {
	mutation_calculateDifferences,
	action_readDom,
} from "./state/calculations";
import { action_updateCallbacks } from "./state/callbacks";
import { action_updateElements } from "./state/elements";
import { action_updateKeyframes } from "./state/keyframes";
import { action_updateOptions } from "./state/options";
import { init_mutationObserver } from "./helper/mutation-observer";
import { execute } from "./helper/iterables";
import { init_resizeObserver } from "./helper/resize-observer";

const preparationFlow = [
	action_updateElements,
	action_updateOptions,
	action_updateKeyframes,
	action_updateCallbacks,
];

const recalcFlow = [
	action_readDom,
	mutation_calculateDifferences,
	mutation_createWAAPI,
];

const recalculateStyles = execute(...recalcFlow);
const recalculateEverything = execute(...preparationFlow, ...recalcFlow);

export const bewegung2 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();
	formatInputs(...animationInput);

	recalculateEverything();

	const MO = init_mutationObserver({
		full: recalculateEverything,
		stylesOnly: recalculateStyles,
	});

	const RO = init_resizeObserver(recalculateStyles);

	logCalculationTime(start);

	return {
		play: () => {
			MO.disconnect();
			RO.disconnect();
			play_animation();
		},
		pause: () => pause_animation(),
	};
};
