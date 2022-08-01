import {
	getAllElements,
	getCallbacks,
	state_context,
	state_mainElements,
} from "../prepare/prepare";
import { Animate } from "../types";
import { constructKeyframes } from "./keyframes";
import {
	cancelAnimation,
	commitAnimationStyles,
	finishAnimation,
	getFinishPromise,
	keepProgress,
	pauseAnimation,
	playAnimation,
	reverseAnimation,
	scrollAnimation,
} from "./methods";

export const animate = (): Animate => {
	const { totalRuntime } = state_context;
	const elementAnimations: Animation[] = [];
	const callbackAnimations: Animation[] = [];

	getAllElements().forEach((element) => {
		elementAnimations.push(...constructKeyframes(element));
	});

	state_mainElements.forEach((element) => {
		//!: this is wrong, it would execute the callback multiple times
		//TODO: do this only for each chunk. Maybe the function could return all if no element is provided
		getCallbacks(element)?.forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			callbackAnimations.push(animation);
		});
	});

	const allAnimations = [...elementAnimations, ...callbackAnimations];
	let prefixedScrollAnimation: (
		progress: number,
		done?: boolean | undefined
	) => void;

	return {
		playAnimation: () => playAnimation(allAnimations),
		pauseAnimation: () => pauseAnimation(allAnimations),
		keepProgress: () => keepProgress(elementAnimations[0]),
		scrollAnimation: (progress: number, done?: boolean) => {
			if (!prefixedScrollAnimation) {
				prefixedScrollAnimation = scrollAnimation(allAnimations);
			}
			prefixedScrollAnimation(progress, done);
		},
		reverseAnimation: () => reverseAnimation(allAnimations),
		cancelAnimation: () => cancelAnimation(allAnimations),
		commitAnimationStyles: () => commitAnimationStyles(allAnimations),
		updatePlaybackRate: (newPlaybackRate: number) =>
			allAnimations.forEach((animation) =>
				animation.updatePlaybackRate(newPlaybackRate)
			),
		finishAnimation: () => finishAnimation(allAnimations),
		finishPromise: getFinishPromise(allAnimations),
		getPlayState: () => elementAnimations[0].playState,
	};
};
