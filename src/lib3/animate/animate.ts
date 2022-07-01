import { state_calculatedDifferences } from "../calculate/calculate";
import { Context } from "../prepare/context";
import {
	getCallbacks,
	getOptions,
	state_dependencyElements,
	state_affectedElements,
	state_mainElements,
} from "../prepare/prepare";
import { getTimelineFractions, Timeline } from "./calculate-timeline";
import {
	getCurrentTime,
	isPaused,
	pauseAnimation,
	playAnimation,
} from "./getters";

const calculateEasingMap = (mainElementOptions: ComputedEffectTiming[]) => {
	const easingTable: Record<number, string> = {};
	const { totalRuntime } = Context;

	const timings: Timeline = mainElementOptions.map(
		({ delay, duration, easing }) => ({
			start: (delay as number) / totalRuntime,
			end: (duration as number) / totalRuntime,
			easing: easing as string,
		})
	);

	getTimelineFractions(timings).forEach((entry, index, array) => {
		const { start } = entry;
		const nextIndex = array[index + 1] ? index + 1 : index;
		const nextEasing = array[nextIndex].easing as string;

		easingTable[start] = nextEasing;
	});
	return easingTable;
};

export interface Animate {
	playAnimation: () => void;
	pauseAnimation: () => void;
	isPaused: () => boolean;
	getCurrentTime: () => number;
}

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
		//TODO: this needs to be adapted to more elements
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
