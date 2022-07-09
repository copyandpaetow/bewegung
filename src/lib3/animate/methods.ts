import {
	filterMatchingStyleFromKeyframes,
	state_elementProperties,
} from "../calculate/calculate";
import {
	state_affectedElements,
	state_context,
	state_mainElements,
} from "../prepare/prepare";

let state_progress = { progress: 0, time: 0 };

const applyStyles = () => {
	state_mainElements.forEach((element) =>
		filterMatchingStyleFromKeyframes(element)
	);

	[...state_mainElements, ...state_affectedElements].forEach((element) => {
		const styles = state_elementProperties.get(element)!;
		if (styles.every((style) => style.computedStyle.borderRadius === "0px")) {
			return;
		}
		Object.assign(element.style, {
			borderRadius: "",
			clipPath: `inset(0px round ${styles.at(-1)!.computedStyle.borderRadius})`,
		});
	});
};

const clamp = (number: number, min = 0, max = 1) =>
	Math.min(Math.max(number, min), max);

const getProgress = () => {
	let progress = state_progress.progress;

	if (state_progress.time !== 0) {
		progress += performance.now() - state_progress.time;
	}
	return progress;
};

export const playAnimation = (animations: Animation[]) => {
	applyStyles();

	animations.forEach((waapi) => {
		waapi.currentTime = getProgress();
		waapi.play();
	});
	state_progress = { progress: 0, time: 0 };
};

export const scrollAnimation = (animations: Animation[]) => {
	applyStyles();
	const { totalRuntime } = state_context;

	return (progress: number, done?: boolean) => {
		if (done) {
			return;
		}

		const currentFrame =
			-1 *
			clamp(progress, 0.001, done === undefined ? 1 : 0.999) *
			totalRuntime;

		animations.forEach((waapi) => {
			waapi.currentTime = currentFrame;
		});
		state_progress.progress = currentFrame;
	};
};

export const pauseAnimation = (animations: Animation[]) => {
	state_progress.progress = animations[0].currentTime ?? 0;
	animations.forEach((waapi) => {
		waapi.pause();
	});
	return;
};

export const keepProgress = (animation: Animation) => {
	const currentTime = animation.currentTime ?? 0;
	const playState = animation.playState;
	if (playState === "running") {
		state_progress = { progress: currentTime, time: performance.now() };
	}

	if (playState === "paused") {
		state_progress.progress = currentTime;
	}
};
