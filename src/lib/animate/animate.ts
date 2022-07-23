import {
	getCallbacks,
	state_affectedElements,
	state_context,
	state_mainElements,
} from "../prepare/prepare";
import { Animate } from "../types";
import { getKeyframes } from "./keyframes";
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

	state_affectedElements.forEach((element) => {
		elementAnimations.push(
			new Animation(
				new KeyframeEffect(element, getKeyframes(element), totalRuntime)
			)
		);
	});

	state_mainElements.forEach((element) => {
		getCallbacks(element)?.forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			callbackAnimations.push(animation);
		});

		elementAnimations.push(
			new Animation(
				new KeyframeEffect(element, getKeyframes(element), totalRuntime)
			)
		);
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
