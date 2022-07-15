import { logCalculationTime } from "../lib/bewegung";
import { prepare } from "./prepare/prepare";
import { formatInputs } from "./inputs/format";
import { effect, observerable } from "./reactive/observable";
import { makeReactive } from "./reactive/reactive";
import { bewegung, bewegungProps, Observer } from "./types";

export const bewegung3 = (...animationInput: bewegungProps): bewegung => {
	const start = performance.now();
	const Input = observerable(formatInputs(...animationInput));
	const State = observerable(prepare(Input()));

	let observer: Observer;
	let calculationProgress = "init";

	effect(() => {
		if (calculationProgress === "init") {
			Input();
			return;
		}
		State(prepare(Input()));
	});

	effect(() => {
		State();
		observer?.disconnect();
		observer = makeReactive(Input, State);
	});

	/*
	upcoming tasks
	TODO: image aspect ratio
	TODO: spans and text nodes
	TODO: rootElement: reevaluate if the root should be included or excluded

	* clip-path can help with image aspect ratio in different ways
	* if the image becomes bigger (and needs to get scaled down)
	- counter scale against parent 
	- clip widthDifference/2 
	- animate the clip-path
	


	*/

	logCalculationTime(start);
	calculationProgress = "ready";

	return {
		play: () => {
			observer.disconnectStateObserver();
			State().playAnimation();
		},
		pause: () => {
			State().pauseAnimation();
		},
		scroll: (progress: number, done?: boolean) => {
			observer.disconnectStateObserver();
			State().scrollAnimation(progress, done);
		},
		reverse: () => {
			observer.disconnectStateObserver();
			State().reverseAnimation();
		},
		cancel: () => {
			observer.disconnect();
			State().cancelAnimation();
		},
		finish: () => {
			observer.disconnect();
			State().finishAnimation();
		},
		commitStyles: () => {
			observer.disconnect();
			State().commitAnimationStyles();
		},
		updatePlaybackRate: (newPlaybackRate: number) => {
			State().updatePlaybackRate(newPlaybackRate);
		},
		finished: State().finishPromise,
		playState: () => State().getPlayState(),
	};
};
