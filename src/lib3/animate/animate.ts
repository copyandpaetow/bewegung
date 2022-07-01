import { state_calculatedDifferences } from "../calculate/calculate";
import { Context } from "../prepare/context";
import {
	getCallbacks,
	getOptions,
	state_dependencyElements,
	state_affectedElements,
	state_mainElements,
} from "../prepare/prepare";
import { Animate } from "../types";
import { calculateEasingMap } from "./calculate-timeline";
import {
	getCurrentTime,
	isPaused,
	pauseAnimation,
	playAnimation,
} from "./methods";

export const animate = (progress?: () => number): Animate => {
	const { totalRuntime } = Context;
	const allAnimations: Animation[] = [];

	state_affectedElements.forEach((element) => {
		const options: ComputedEffectTiming[] = [];

		state_dependencyElements
			.get(element)!
			.forEach((element) =>
				getOptions(element).forEach((option) => options.push(option))
			);

		const easingTable = calculateEasingMap(options);

		const keyframes = state_calculatedDifferences.get(element)!.map(
			({
				xDifference,
				yDifference,
				widthDifference,
				heightDifference,
				offset,
			}) =>
				({
					offset,
					composite: "auto",
					easing: easingTable[offset],
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);

		allAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	state_mainElements.forEach((element) => {
		const easingTable = calculateEasingMap(getOptions(element));
		const keyframes = state_calculatedDifferences.get(element)!.map(
			({
				xDifference,
				yDifference,
				widthDifference,
				heightDifference,
				offset,
			}) =>
				({
					offset,
					composite: "auto",
					easing: easingTable[offset],
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);

		getCallbacks(element)?.forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			allAnimations.push(animation);
		});

		allAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	return {
		playAnimation: () => playAnimation(allAnimations, progress?.()),
		pauseAnimation: () => pauseAnimation(allAnimations),
		isPaused: () => isPaused(allAnimations),
		getCurrentTime: () => getCurrentTime(allAnimations),
	};
};
