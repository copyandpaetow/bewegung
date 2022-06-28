import { state_calculatedDifferences } from "../calculate/state";
import { Context } from "../elements/context";
import { Elements } from "../elements/getters";
import { state_affectedElements, state_mainElements } from "../elements/state";
import {
	state_affectedElementEasings,
	state_callbacks,
	state_keyframes,
	state_options,
} from "../elements/state";
import { getTimelineFractions, Timeline } from "./calculate-timeline";
import { updateAnimations } from "./getters";

export let state_animations = new WeakMap<HTMLElement, Animation>();
export let state_callbackAnimations = new WeakMap<HTMLElement, Animation[]>();

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

export const animate = () => {
	const { main, affected } = Elements;
	const { totalRuntime } = Context;

	affected.forEach((element) => {
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
		state_animations.set(
			element,
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	main.forEach((element) => {
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
		const callbackAnimations: Animation[] = [];
		state_callbacks.get(element)?.forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			callbackAnimations.push(animation);
		});

		state_animations.set(
			element,
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
		state_callbackAnimations.set(element, callbackAnimations);
	});
	return updateAnimations();
};
