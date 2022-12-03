import {
	AnimationEntry,
	Callbacks,
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
	CustomKeyframeEffect,
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

export const addIndividualEasing = (entry: AnimationEntry) => {
	const { easing, composite } = entry.options;

	entry.keyframes = entry.keyframes.map((keyframe) => {
		const { offset, ...styles } = keyframe;

		const individualEasing =
			styles.animationTimingFunction ?? styles.transitionTimingFunction ?? easing;

		return {
			offset,
			easing: individualEasing,
			composite,
			...styles,
		};
	});
};

export const separateKeyframesAndCallbacks = (
	normalizedProps: CustomKeyframeEffect[],
	chunkIDs: string[]
) => {
	const keyframes = new Map<string, CustomKeyframe[]>();
	const callbacks = new Map<string, Callbacks[]>();

	normalizedProps.forEach((entry, index) => {
		const normalizedKeyframes = unifyKeyframeStructure(entry[1]);
		const chunkID = chunkIDs[index];

		normalizedKeyframes.forEach((keyframe) => {
			const { callback, offset, ...styles } = keyframe;

			if (callback) {
				callbacks.set(
					chunkID,
					(callbacks.get(chunkID) ?? []).concat({ callback, offset } as Callbacks)
				);
			}

			keyframes.set(
				chunkID,
				(keyframes.get(chunkID) ?? []).concat({ ...styles, offset } as CustomKeyframe)
			);
		});
	});
	return { callbacks, keyframes };
};