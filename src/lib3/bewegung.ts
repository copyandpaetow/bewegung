import { logCalculationTime } from "../lib/bewegung";
import { animate } from "./animate/animate";
import { calculate } from "./calculate/calculate";
import { prepare } from "./prepare/prepare";
import { formatInputs } from "./inputs/format";
import { effect, observerable } from "./reactive/observable";
import { makeReactive } from "./reactive/reactive";
import { Animate, CustomKeyframeEffect, Observer, Observerable } from "./types";

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
			State = observerable((prepare(Input()), calculate(), animate(Progress)));
			return;
		}
		State((prepare(Input()), calculate(), animate(Progress)));
	});

	effect(() => {
		State(), Progress();
		observer?.disconnect();
		observer = makeReactive(Input, State, Progress);
	});

	/*
	upcoming tasks
	TODO: make the setup more functional
	TODO: image aspect ratio and border-radius 
	TODO: recheck the IO
	TODO: scroll, reverse, cancel, finish, commitStyles, updatePlaybackRate
	TODO: `delay: start, duration: end, endDelay` is often used but maybe `activeTime` and `endTime` could simplify things
	?: does display: none work now? 
	?: Should elements be filtered that dont change? They might change later
	TODO: spans and text nodes
	TODO: a config object with keepAlive, no reactivity etc 
	TODO: rootElement: reevaluate if the root should be included or excluded


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
