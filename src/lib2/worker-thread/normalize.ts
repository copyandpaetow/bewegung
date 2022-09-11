import { defaultOptions } from "../constants";
import {
	Callbacks,
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
} from "../types";
import { formatKeyframes } from "./format-keyframes";

export const normalizeKeyframes = (
	oldKeyframes:
		| CustomKeyframe
		| CustomKeyframe[]
		| CustomKeyframeArrayValueSyntax,
	options: KeyframeEffectOptions
) => {
	const { easing = "ease", composite } = options;

	const formattedKeyFrames = formatKeyframes(oldKeyframes);

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
			composite: composite ?? "replace",
			...styles,
		});
	});

	return {
		keyframes,
		callbacks,
	};
};

const getDefaultOptions = (userOptions: Partial<KeyframeEffectOptions>) => {
	const input = {
		...defaultOptions,
		...userOptions,
	};

	const endTime = Number(input.duration) * input.iterations!;

	return {
		...input,
		activeDuration: endTime,
		currentIteration: null,
		endTime,
		localTime: null,
		progress: null,
	};
};

export const normalizeOptions = (
	oldOptions: number | KeyframeEffectOptions | undefined
): KeyframeEffectOptions => {
	if (!oldOptions) {
		return getDefaultOptions(defaultOptions);
	}

	const userOptions =
		typeof oldOptions === "object" ? oldOptions : { duration: oldOptions };
	return getDefaultOptions(userOptions);
};
