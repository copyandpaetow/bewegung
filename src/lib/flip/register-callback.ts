import { Flip } from "./create-flip-engine";

export const registerMidAnimationCallbacks = (key: HTMLElement, value: Flip) =>
	(value.callbacks || []).map((entry) => {
		const decoyAnimation = new Animation(
			new KeyframeEffect(
				key,
				null,
				entry.offset *
					(value.keyframeInstance.getComputedTiming().endTime as number)
			)
		);
		decoyAnimation.onfinish = entry.callback;
		return decoyAnimation;
	});
