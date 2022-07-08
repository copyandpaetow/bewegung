import { filterMatchingStyleFromKeyframes } from "../calculate/calculate";
import { state_mainElements } from "../prepare/prepare";

let state_progress = { progress: 0, time: 0 };

export const playAnimation = (animations: Animation[]) => {
	state_mainElements.forEach((element) =>
		filterMatchingStyleFromKeyframes(element)
	);
	let progress = state_progress.progress;

	if (state_progress.time !== 0) {
		progress += performance.now() - state_progress.time;
	}
	animations.forEach((waapi) => {
		waapi.currentTime = progress;
		waapi.play();
	});
	state_progress = { progress: 0, time: 0 };
};

export const pauseAnimation = (animations: Animation[]) => {
	state_progress = {
		...state_progress,
		progress: animations[0].currentTime ?? 0,
	};
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
		state_progress = { ...state_progress, progress: currentTime };
	}
};
