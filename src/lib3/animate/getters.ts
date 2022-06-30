import { state_keyframes, state_mainElements } from "../elements/state";

const applyStyles = (mainElements: Set<HTMLElement>) => {
	mainElements.forEach((element) => {
		const keyframes = state_keyframes.get(element);

		const resultingStyle = keyframes?.reduce(
			(
				accumulator,
				{ offset, composite, computedOffset, easing, ...styles }
			) => {
				return { ...accumulator, ...styles };
			},
			{}
		);
		Object.assign(element.style, resultingStyle);
	});
};

let currentAnimationTime;

export const playAnimation = (animations: Animation[], progress?: number) => {
	applyStyles(state_mainElements);
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
