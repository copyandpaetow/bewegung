import {
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
	EveryKeyframeSyntax,
	ValueOf,
} from "../types";

const calculateOffsets = (offsets: (number | undefined)[]): number[] => {
	if (offsets.toString() !== [...offsets].sort().toString()) {
		throw new Error("offsets are not sorted from smallest to largest");
	}

	if (offsets.length === 1 && offsets[0] === undefined) {
		return [1];
	}

	if (offsets.every((offset) => offset === undefined)) {
		return offsets.map((_, index, array) => (index === 0 ? 0 : index / (array.length - 1)));
	}

	return offsets.map((offset, index, array) => {
		if (offset) {
			return offset;
		}

		if (index === 0 || index === 1) {
			return index;
		}

		const remainingOffsets = array.slice(index);
		const nextExistingIndex = remainingOffsets.findIndex(Boolean)!;
		const nextValue = remainingOffsets[nextExistingIndex] ?? 1;
		const previousValue = array[index - 1]!;
		const range = nextValue - previousValue;
		return range / nextExistingIndex + 1;
	});
};

const formatArraySyntax = (
	keyframeWithArraySyntax: CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	const amountOfKeyframeObjects = Object.values(keyframeWithArraySyntax).reduce(
		(highestValue, newValue) => Math.max(highestValue, newValue?.length || 0),
		0
	);

	const { offset: keyframeOffset, ...keyframeWithoutOffset } = keyframeWithArraySyntax;

	const offsetArray = new Array(amountOfKeyframeObjects)
		.fill(undefined)
		.map((_, index) => (keyframeOffset?.[index] as number | undefined) ?? undefined);

	const allOffsets = calculateOffsets(offsetArray);

	const newKeyframes: CustomKeyframe[] = [];

	Object.entries(keyframeWithoutOffset).forEach(
		([property, value]: [string, ValueOf<CustomKeyframeArrayValueSyntax>]) => {
			value?.forEach((entry: ValueOf<CustomKeyframe>, index: number) => {
				newKeyframes[index] = {
					...newKeyframes[index],
					offset: allOffsets[index],
					...{ [property]: entry },
				};
			});
		}
	);

	return newKeyframes;
};

const addKeyframeOffset = (allKeyframes: CustomKeyframe[]): CustomKeyframe[] => {
	const offsets = calculateOffsets(allKeyframes.map((keyframe) => keyframe.offset));

	return allKeyframes.map((keyframe, index) => {
		keyframe.offset = offsets[index];
		return keyframe;
	});
};

export const unifyKeyframeStructure = (keyframe: EveryKeyframeSyntax): CustomKeyframe[] => {
	if (Array.isArray(keyframe)) {
		return addKeyframeOffset(keyframe);
	}
	if (Object.values(keyframe).every((value) => !Array.isArray(value))) {
		return addKeyframeOffset([keyframe] as CustomKeyframe[]);
	}
	if (Object.values(keyframe).every((value) => Array.isArray(value))) {
		return formatArraySyntax(keyframe as CustomKeyframeArrayValueSyntax);
	}
	throw new Error("No mixing between array and object syntax");
};
