import { prepare } from "./prepare/prepare";
import { formatInputs } from "./inputs/format";
import { effect, observerable } from "./reactive/observable";
import { makeReactive } from "./reactive/reactive";
import { bewegung, bewegungProps, Observer } from "./types";

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
