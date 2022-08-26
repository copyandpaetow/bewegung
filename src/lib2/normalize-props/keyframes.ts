import {
	CustomKeyframeArrayValueSyntax,
	CustomKeyframe,
	ValueOf,
} from "../types";

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

			if ((keyframeOffset as number[]).at(-1) !== 1) {
				const step =
					(1 - parseFloat(`${(keyframeOffset as number[]).at(-1)}`)) /
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

export const formatKeyframes = (
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
