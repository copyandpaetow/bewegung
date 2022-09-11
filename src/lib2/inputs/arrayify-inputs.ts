import { CustomKeyframeEffect, CustomKeyframe } from "../types";

const convertToCustomKeyframe = (kfe: KeyframeEffect): CustomKeyframeEffect => {
	const {
		target,
		getKeyframes,
		getComputedTiming,
		composite,
		pseudoElement,
		iterationComposite,
	} = kfe;

	if (!target || !pseudoElement) {
		throw new Error("nothing to animate");
	}

	return [
		target as HTMLElement,
		getKeyframes() as CustomKeyframe[],
		{ ...getComputedTiming(), composite, pseudoElement, iterationComposite },
	];
};

export const arrayifyInputs = (
	animationInput:
		| CustomKeyframeEffect
		| KeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): CustomKeyframeEffect[] => {
	if (animationInput instanceof KeyframeEffect) {
		return [convertToCustomKeyframe(animationInput)];
	}

	if (
		animationInput.some(
			(prop) => !Array.isArray(prop) && !(prop instanceof KeyframeEffect)
		)
	) {
		return [animationInput] as CustomKeyframeEffect[];
	}

	return (animationInput as (CustomKeyframeEffect | KeyframeEffect)[]).map(
		(subAnimation) => {
			if (subAnimation instanceof KeyframeEffect) {
				return convertToCustomKeyframe(subAnimation);
			}
			return subAnimation;
		}
	);
};
