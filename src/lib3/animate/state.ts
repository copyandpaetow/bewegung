import { state_calculatedDifferences } from "../calculate/state";
import { Context } from "../elements/context";
import {
	state_affectedElementEasings,
	state_affectedElements,
	state_callbacks,
	state_mainElements,
	state_options,
} from "../elements/state";
import { getTimelineFractions, Timeline } from "./calculate-timeline";
import {
	getCurrentTime,
	isPaused,
	pauseAnimation,
	playAnimation,
} from "./getters";

const calculateEasingMap = (mainElements: Timeline | undefined) => {
	if (!mainElements) {
		return {};
	}
	const easingTable: Record<number, string> = {};

	getTimelineFractions(mainElements as Timeline).forEach(
		(entry, index, array) => {
			const { start } = entry;
			const nextIndex = array[index + 1] ? index + 1 : index;
			const nextEasing = array[nextIndex].easing as string;

			easingTable[start] = nextEasing;
		}
	);
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
		const easingTable = calculateEasingMap(
			state_affectedElementEasings.get(element)
		);

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
		const options = state_options.get(element);
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
					easing: options!.easing,
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);

		state_callbacks.get(element)?.forEach(({ offset, callback }) => {
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
