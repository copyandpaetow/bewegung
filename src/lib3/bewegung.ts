import { logCalculationTime } from "../lib/bewegung";
import { Animate, animate } from "./animate/state";
import { calculate } from "./calculate/state";
import { setState } from "./elements/state";
import { formatInputs } from "./inputs/format-inputs";
import { effect, Observerable, observerable } from "./reactivity/observable";
import { Observer, reactivity } from "./reactivity/state";
import { CustomKeyframeEffect } from "./types";

interface bewegung {
	play: () => void;
	pause: () => void;
}

export const bewegung3 = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): bewegung => {
	const start = performance.now();
	const Input = observerable(formatInputs(...animationInput));
	const Progress = observerable(0);

	let State: Observerable<Animate>;
	let observer: Observer;

	effect(() => {
		if (!State) {
			State = observerable((setState(Input()), calculate(), animate(Progress)));
			return;
		}
		State((setState(Input()), calculate(), animate(Progress)));
	});

	effect(() => {
		State(), Progress();
		observer?.disconnect();
		observer = reactivity(Input, State, Progress);
	});

	/*
	upcoming tasks
	TODO: the same element could be in different chunks for different animation (animate rotate/opacity separatly)
	TODO: image aspect ratio and border-radius 
	TODO: scroll, reverse, cancel, finish, commitStyles, updatePlaybackRate
	TODO: `delay: start, duration: end, endDelay` is often used but maybe `activeTime` and `endTime` could simplify things
	?: does display: none work now? 
	?: Should elements be filtered that dont change? They might change later
	TODO: spans and text nodes
	TODO: a config object with keepAlive, no reactivity etc 

	*/

	logCalculationTime(start);

	return {
		play: () => {
			observer.disconnect();
			State().playAnimation();
		},
		pause: () => {
			State().pauseAnimation();
		},
	};
};
