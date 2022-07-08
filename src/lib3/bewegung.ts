import { logCalculationTime } from "../lib/bewegung";
import { prepare } from "./prepare/prepare";
import { formatInputs } from "./inputs/format";
import { effect, observerable } from "./reactive/observable";
import { makeReactive } from "./reactive/reactive";
import { bewegung, bewegungProps, Observer } from "./types";
import { calculateContext } from "./prepare/context";

export const bewegung3 = (...animationInput: bewegungProps): bewegung => {
	const start = performance.now();
	const Input = observerable(formatInputs(...animationInput));
	const Context = observerable(calculateContext(Input()));
	const State = observerable(prepare(Input(), Context));

	let observer: Observer;
	let calculationProgress = "init";

	effect(() => {
		if (calculationProgress === "init") {
			Input();
			return;
		}
		Context(calculateContext(Input()));
		State(prepare(Input(), Context));
	});

	effect(() => {
		State(), Context();
		observer?.disconnect();
		observer = makeReactive(Input, State, Context);
	});

	/*
	upcoming tasks
	TODO: image aspect ratio and border-radius 
	TODO: recheck the IO
	TODO: scroll, reverse, cancel, finish, commitStyles, updatePlaybackRate
	TODO: `delay: start, duration: end, endDelay` is often used but maybe `activeTime` and `endTime` could simplify things
	?: does display: none work now? 
	?: Should elements be filtered that dont change? They might change later
	TODO: spans and text nodes
	TODO: rootElement: reevaluate if the root should be included or excluded


	*/

	logCalculationTime(start);
	calculationProgress = "ready";

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
