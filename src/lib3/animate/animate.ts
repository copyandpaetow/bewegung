import { state_calculatedDifferences } from "../calculate/calculate";
import {
	getCallbacks,
	getOptions,
	state_dependencyElements,
	state_affectedElements,
	state_mainElements,
	state_context,
} from "../prepare/prepare";
import { Animate } from "../types";
import { calculateEasingMap } from "./calculate-timeline";
import { keepProgress, pauseAnimation, playAnimation } from "./methods";

export const animate = (): Animate => {
	const { totalRuntime, progress } = state_context;
	const elementAnimations: Animation[] = [];
	const callbackAnimations: Animation[] = [];

	state_affectedElements.forEach((element) => {
		const options: ComputedEffectTiming[] = [];

		state_dependencyElements
			.get(element)!
			.forEach((element) =>
				getOptions(element).forEach((option) => options.push(option))
			);

		const easingTable = calculateEasingMap(options, totalRuntime);

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

		elementAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	state_mainElements.forEach((element) => {
		const easingTable = calculateEasingMap(getOptions(element), totalRuntime);
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
			callbackAnimations.push(animation);
		});

		elementAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	const allAnimations = [...elementAnimations, ...callbackAnimations];

	return {
		playAnimation: () => playAnimation(allAnimations),
		pauseAnimation: () => pauseAnimation(allAnimations),
		keepProgress: () => keepProgress(elementAnimations[0]),
	};
};
