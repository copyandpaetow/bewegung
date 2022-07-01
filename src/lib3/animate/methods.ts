import { filterMatchingStyleFromKeyframes } from "../calculate/calculate";
import { state_mainElements } from "../prepare/prepare";

let currentAnimationTime;

export const playAnimation = (animations: Animation[], progress?: number) => {
	state_mainElements.forEach((element) =>
		filterMatchingStyleFromKeyframes(element)
	);
	animations.forEach((waapi) => {
		progress && (waapi.currentTime = progress);
		waapi.play();
	});
};

export const pauseAnimation = (animations: Animation[]) => {
	let currentTime = 0;
	animations.forEach((waapi) => {
		currentTime = Math.max(currentTime, waapi.currentTime ?? 0);
		waapi.pause();
	});
	currentAnimationTime = currentTime;
	return;
};

export const isPaused = (animations: Animation[]) =>
	animations.some((animation) => animation.playState === "paused");

export const getCurrentTime = (animations: Animation[]) => {
	currentAnimationTime = animations.reduce(
		(longest, current) => Math.max(longest, current.currentTime ?? 0),
		0
	);
	return currentAnimationTime;
};
