import { filterMatchingStyleFromKeyframes } from "../calculate/calculate";
import {
	state_context,
	state_mainElements,
	state_originalStyle
} from "../prepare/prepare";

let state_progress = { progress: 0, time: 0 };
let state_stylesApplied = false;

const applyStyles = (animations: Animation[]) => {
	if (state_stylesApplied) {
		return;
	}

	state_mainElements.forEach((element) =>
		filterMatchingStyleFromKeyframes(element)
	);
	state_stylesApplied = true;
	getFinishPromise(animations).then(() => {
		state_stylesApplied = false;
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
	applyStyles(animations);

	animations.forEach((waapi) => {
		waapi.currentTime = getProgress();
		waapi.play();
	});
	state_progress = { progress: 0, time: 0 };
};

export const scrollAnimation = (animations: Animation[]) => {
	applyStyles(animations);
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

export const reverseAnimation = (animations: Animation[]) => {
	applyStyles(animations);
	animations.forEach((waapi) => {
		waapi.reverse();
	});
};
export const cancelAnimation = (animations: Animation[]) => {
	state_mainElements.forEach(
		(element) => (element.style.cssText = state_originalStyle.get(element)!)
	);

	animations.forEach((waapi) => {
		waapi.cancel();
	});
	state_stylesApplied = false;
};
export const commitAnimationStyles = (animations: Animation[]) => {
	animations.forEach((waapi) => {
		waapi.commitStyles();
	});
};
export const finishAnimation = (animations: Animation[]) => {
	animations.forEach((waapi) => {
		waapi.finish();
	});
	state_stylesApplied = false;
};

export const getFinishPromise = (animations: Animation[]) => {
	return Promise.all(animations.map((animation) => animation.finished));
};
