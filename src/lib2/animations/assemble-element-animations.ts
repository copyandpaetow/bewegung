import { BidirectionalMap } from "../inputs/bidirectional-map";
import { applyStyleObject } from "../read-dom/read-dom";
import { PreAnimation } from "../types";

export const assembleElementAnimations = (
	elementKeyMap: BidirectionalMap<HTMLElement, string>,
	elementAnimationMap: Map<string, PreAnimation>
) => {
	const animations: Animation[] = [];
	const beforeCallbacks: VoidFunction[] = [];

	elementAnimationMap.forEach((animationValue, stringId) => {
		const element = elementKeyMap.get(stringId)!;

		animations.push(
			new Animation(
				new KeyframeEffect(
					element,
					animationValue.keyframes,
					animationValue.options
				)
			)
		);

		beforeCallbacks.push(() => {
			applyStyleObject(element, animationValue.overwrite);
		});
	});

	return { animations, beforeCallbacks };
};
