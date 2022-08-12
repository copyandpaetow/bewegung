import { prepare } from "./prepare/prepare";
import { formatInputs } from "./input/format";
import { effect, observerable } from "./react/observable";
import { makeReactive } from "./react/react";
import { Bewegung, bewegungProps, Observer } from "./types";

const logCalculationTime = (startingTime: number) => {
	const end = performance.now() - startingTime;
	if (end < 50) {
		console.log(`animation calculation was fast with ${end}ms`);
	}
	if (end > 50) {
		console.warn(`animation calculation was slow with ${end}ms`);
	}
	if (end > 100) {
		console.error(
			`animation calculation was so slow that the user might notice with ${end}ms`
		);
	}
};

export const bewegung = (...animationInput: bewegungProps): Bewegung => {
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
		queueMicrotask(() => {
			if (calculationProgress !== "ready") {
				return;
			}
			observer?.disconnect();
			observer = makeReactive(Input, State);
		});
	});

	logCalculationTime(start);
	calculationProgress = "ready";

	return {
		play: () => {
			calculationProgress = "playing";
			observer?.disconnectStateObserver();
			State().playAnimation();
		},
		pause: () => {
			calculationProgress = "paused";
			State().pauseAnimation();
		},
		scroll: (progress: number, done?: boolean) => {
			calculationProgress = "playing";
			observer?.disconnectStateObserver();
			State().scrollAnimation(progress, done);
		},
		reverse: () => {
			calculationProgress = "playing";
			observer?.disconnectStateObserver();
			State().reverseAnimation();
		},
		cancel: () => {
			observer?.disconnect();
			State().cancelAnimation();
			calculationProgress = "done";
		},
		finish: () => {
			observer?.disconnect();
			State().finishAnimation();
			calculationProgress = "done";
		},
		commitStyles: () => {
			observer?.disconnect();
			State().commitAnimationStyles();
			calculationProgress = "done";
		},
		updatePlaybackRate: (newPlaybackRate: number) => {
			State().updatePlaybackRate(newPlaybackRate);
		},
		finished: State().finishPromise,
		playState: () => State().getPlayState(),
	};
};
