import { defaultOptions } from "../constants";
import {
	Callbacks,
	Chunks,
	CustomKeyframeEffect,
	CustomKeyframe,
} from "../types";
import { formatKeyframes } from "./keyframes";
import { normalizeElements } from "./elements";

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

export const normalizeKeyframes = (input: CustomKeyframeEffect) => {
	const options = new KeyframeEffect(null, null, input[2] || defaultOptions);
	const easing = options.getComputedTiming().easing!;
	const composite = options.composite;

	const formattedKeyFrames = formatKeyframes(input[1]);

	const callbacks: Callbacks[] = [];
	const keyframes: ComputedKeyframe[] = [];

	formattedKeyFrames.forEach((keyframe, index, array) => {
		//TODO: this offset calc is flawed / too simple
		//! if the offsets are 0.5, x, y it would make 0.5, 0.66, 1 and not 0.5, 0.75, 1
		const offset =
			keyframe.offset || isNaN(index / (array.length - 1))
				? 1
				: index / (array.length - 1);

		const { callback, ...styles } = keyframe;
		if (callback) {
			callbacks.push({ callback, offset });
		}
		keyframes.push({
			offset,
			computedOffset: offset,
			easing,
			composite,
			...styles,
		});
	});

	return {
		keyframes,
		callbacks,
		options: options.getComputedTiming(),
	};
};

export const normalizeProps = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): Chunks[] =>
	arrayifyInputs(animationInput).map((input) => {
		const target = normalizeElements(input[0]);
		const { keyframes, callbacks, options } = normalizeKeyframes(input);
		//TODO: composite is missing

		const selector = typeof input[0] === "string" ? input[0] : null;

		return { target, keyframes, callbacks, options, selector };
	});
