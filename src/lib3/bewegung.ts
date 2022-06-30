import { logCalculationTime } from "../lib/bewegung";
import { formatInputs } from "./inputs/format-inputs";
import { setState } from "./elements/state";
import { Chunks, CustomKeyframeEffect } from "./types";
import { calculate } from "./calculate/state";
import { Animate, animate } from "./animate/state";
import {
	ObserveDomMutations,
	ObserveElementDimensionChanges,
} from "./reactivity/state";
import { effect, Observerable, observerable } from "./reactivity/observable";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ||= window.requestAnimationFrame;
}

type Observer = { disconnect: () => void };

type Reactivity = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Progress: Observerable<number>
) => Observer;

const reactivity: Reactivity = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Progress: Observerable<number>
) => {
	console.log("init reactivity");
	const observeDOM = ObserveDomMutations(Input, (changes: Chunks[]) => {
		Input(changes);
		if (!State().isPaused) {
			return;
		}
		Progress(State().getCurrentTime());
	});

	const observeDimensions = ObserveElementDimensionChanges(() => {
		//TODO: this might not work if the animation is running
		State((calculate(), animate(Progress)));
	});

	const disconnect = () => {
		observeDOM.disconnect();
		observeDimensions.disconnect();
	};

	return { disconnect };
};

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
		//if the inputs are update, update the state
		State = observerable((setState(Input()), calculate(), animate(Progress)));
		console.log("on input change");
	});

	effect(() => {
		//if the state or the progress change, update the reactivity callback
		State(), Progress();
		observer?.disconnect();
		observer = reactivity(Input, State, Progress);
		console.log("on state or progress change");
	});

	/*
	upcoming tasks
	TODO: reactivity for mutations, resizes, and positional Changes (IO)
	TODO: the same element could be in different chunks for different animation (animate rotate/opacity separatly)
	TODO: image aspect ratio and border-radius 
	?: does display: none work now? 
	TODO: spans and text nodes

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
