import {
	BewegungsOptions,
	Callbacks,
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
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
		return offsets.map((_, index, array) =>
			index === 0 ? 0 : index / (array.length - 1)
		);
	}

	return offsets.map((offset, index, array) => {
		if (offset) {
			return offset;
		}

		if (index === 0 || index === 1) {
			return index;
		}

		const rest = array.slice(index);
		const nextExistingIndex = rest.findIndex(Boolean)!;
		const nextValue = rest[nextExistingIndex] ?? 1;
		const previousValue = array[index - 1]!;
		const range = nextValue - previousValue;
		return range / nextExistingIndex + 1;
	});
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

	const offsetArray = new Array(amountOfObjects)
		.fill(undefined)
		.map(
			(_, index) => (keyframeOffset?.[index] as number | undefined) ?? undefined
		);

	const allOffsets = calculateOffsets(offsetArray);
	console.log({ amountOfObjects, keyframeOffset, offsetArray, allOffsets });

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

const addKeyframeOffset = (
	allKeyframes: CustomKeyframe[]
): CustomKeyframe[] => {
	const offsets = calculateOffsets(
		allKeyframes.map((keyframe) => keyframe.offset)
	);

	return allKeyframes.map((keyframe, index) => {
		keyframe.offset = offsets[index];
		return keyframe;
	});
};

export const formatKeyframes = (
	keyframe: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
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

export const addIndividualEasing = (
	keyframes: CustomKeyframe[],
	options: BewegungsOptions
) => {
	const { easing, composite } = options;
	return keyframes.map((keyframe) => {
		const { offset, ...styles } = keyframe;

		const individualEasing =
			styles.animationTimingFunction ??
			styles.transitionTimingFunction ??
			easing;

		return {
			offset,
			computedOffset: offset,
			easing: individualEasing,
			composite,
			...styles,
		};
	});
};

export const separateKeyframesAndCallbacks = (
	AllKeyframes: CustomKeyframe[]
) => {
	const keyframes: CustomKeyframe[] = [];
	const callbacks: Callbacks[] = [];

	AllKeyframes.forEach((unfilteredKeyframes) => {
		const { callback, offset, ...rest } = unfilteredKeyframes;

		if (callback) {
			callbacks.push({ callback, offset: offset! });
		}
		keyframes.push({ ...rest, offset: offset! });
	});

	return {
		keyframes,
		callbacks,
	};
};
