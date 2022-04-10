import { CustomKeyframeEffect, NormalizedInput } from "../bewegung";
import {
	Callbacks,
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
	Options,
	ValueOf,
} from "../types";
import { lastIn } from "../utils/array-helpers";
import {
	filterEmptyObjectEntries,
	splitObjectBy,
} from "../utils/object-helpers";
import { normalizeElement } from "./dom-normalize-element";

export const arrayifyInputs = (
	animationInput:
		| CustomKeyframeEffect
		| KeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): (CustomKeyframeEffect | KeyframeEffect)[] => {
	if (
		animationInput instanceof KeyframeEffect ||
		animationInput.some((prop) => !Array.isArray(prop))
	) {
		return [animationInput] as (CustomKeyframeEffect | KeyframeEffect)[];
	}
	return animationInput as (CustomKeyframeEffect | KeyframeEffect)[];
};

export const expandTargetsIntoEntries = (
	animationArguments: (CustomKeyframeEffect | KeyframeEffect)[]
): (CustomKeyframeEffect | KeyframeEffect)[] =>
	animationArguments.reduce(
		(
			accumulator: (CustomKeyframeEffect | KeyframeEffect)[],
			current: CustomKeyframeEffect | KeyframeEffect
		) => {
			if (current instanceof KeyframeEffect) {
				return [...accumulator, current];
			}

			const [target, keyframes, option] = current;

			const expandedTargets = normalizeElement(target).map(
				(newTarget) => [newTarget, keyframes, option] as CustomKeyframeEffect
			);

			return [...accumulator, ...expandedTargets];
		},
		[]
	);

const getExtraOptions = (option: number | Options | undefined) => {
	if (!option || typeof option === "number") {
		return null;
	}
	return filterEmptyObjectEntries(option);
};

const formatArraySyntax = (
	keyframeWithArraySyntax: CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	const amountOfObjects = Object.values(keyframeWithArraySyntax).reduce(
		(highestValue, newValue) => Math.max(highestValue, newValue?.length || 0),
		0
	);

	const { offset: keyframeOffset, ...keyframeWithoutOffset } =
		keyframeWithArraySyntax;

	const objectArray: CustomKeyframe[] = Array.from(
		{ length: amountOfObjects },
		(_, index) => {
			if (!keyframeOffset?.length) {
				return {
					offset: index / (amountOfObjects - 1),
				};
			}

			if (keyframeOffset[index]) {
				return {
					offset: keyframeOffset[index] as number,
				};
			}

			if (lastIn(keyframeOffset as number[]) !== 1) {
				const step =
					(1 - parseFloat(`${lastIn(keyframeOffset as number[])}`)) /
					(amountOfObjects - keyframeOffset.length);
				return {
					offset: step * index + 1,
				};
			}

			return {
				offset: 1,
			};
		}
	);

	Object.entries(keyframeWithoutOffset).forEach(
		([key, value]: [string, ValueOf<CustomKeyframeArrayValueSyntax>]) => {
			value?.forEach((entry: ValueOf<CustomKeyframe>, index: number) => {
				objectArray[index] = { ...objectArray[index], ...{ [key]: entry } };
			});
		}
	);

	return objectArray;
};

const formatKeyFrames = (
	keyframe: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	if (Array.isArray(keyframe)) {
		return keyframe;
	}
	if (Object.values(keyframe).every((value) => !Array.isArray(value))) {
		return [keyframe] as CustomKeyframe[];
	}
	if (Object.values(keyframe).every((value) => Array.isArray(value))) {
		return formatArraySyntax(keyframe as CustomKeyframeArrayValueSyntax);
	}
	throw new Error("No mixing between array and object syntax");
};

const splitByKeywords = ([key, _]: [string, unknown]): string | string[] => {
	const groupingKeys = ["callbacks"];
	if (groupingKeys.includes(key)) {
		return key;
	}
	if (key === "offset") {
		return [...groupingKeys, "styles"];
	}

	if (key.includes("transition")) {
		return "unwanted";
	}

	return "styles";
};

const getUnanimatableStyles = (
	computedKeyframes: ComputedKeyframe[],
	originalKeyframes: CustomKeyframe[]
): CustomKeyframe[] =>
	originalKeyframes.reduce((accumulator, currentOriginalKeyframe, index) => {
		const currentComputedFrame = Object.keys(computedKeyframes[index]);
		const remainingStyles = Object.entries(currentOriginalKeyframe).filter(
			([key]) => {
				return !currentComputedFrame.includes(key);
			}
		);

		if (remainingStyles.length === 0) {
			return accumulator;
		}

		const excludedStyles = {
			...Object.fromEntries(remainingStyles),
			offset: computedKeyframes[index].computedOffset ?? 1,
		} as CustomKeyframe;

		return [...accumulator, excludedStyles];
	}, [] as CustomKeyframe[]);

export const createInternalStructure = (
	animationArguments: (CustomKeyframeEffect | KeyframeEffect)[]
): NormalizedInput[] =>
	animationArguments.map((animationMap) => {
		if (animationMap instanceof KeyframeEffect) {
			return {
				keyframeInstance: animationMap,
				extraOptions: null,
				unAnimatableStyles: null,
				callbacks: null,
			};
		}

		const [target, keyframes, option] = animationMap;
		const refinedKeyframes = formatKeyFrames(keyframes);

		const keyframeInstance = new KeyframeEffect(
			target as HTMLElement,
			refinedKeyframes as Keyframe[] | null,
			option
		);

		const sortedInputs = splitObjectBy(
			splitByKeywords,
			getUnanimatableStyles(keyframeInstance.getKeyframes(), refinedKeyframes)
		);

		return {
			extraOptions: getExtraOptions(option),
			unAnimatableStyles: sortedInputs.styles ?? null,
			callbacks: (sortedInputs.callbacks as Callbacks[]) ?? null,
			keyframeInstance,
		};
	});

const DEFAULT_DURATION = 400;

export const addMissingDefaults = (
	animationArguments: NormalizedInput[]
): NormalizedInput[] =>
	animationArguments.map((entry) => {
		const { duration } = entry.keyframeInstance.getComputedTiming();

		if (duration === 0) {
			entry.keyframeInstance.updateTiming({ duration: DEFAULT_DURATION });
		}

		return entry;
	});
