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

	const newKeyframes: CustomKeyframe[] = calculateOffsets(offsetArray).map((offset) => ({
		offset,
	}));

	/*
		TODO: this is not entirely correct, every property creates its own entries and their will be combined in the end
		=> the resulting length of the array can be greater than the longest property array

		e.g.  {height: ["20vh","50vh","70vh"], width: ["30%", "55%", "70%", "90%"]} would create

	[{
		offset: 0,
		height: "20vh",
		width: "30%",
	},
	{
		offset: 0.25,
		width: "55%",
	},
	{
		offset: 0.5,
		height: "50vh",
	},
	{
		offset: 0.75,
		width: "70%",
	},
	{
		offset: 1,
		height: "70vh",
		width: "90%",
	}];

	because the height creates entries with offset: 0,0.5,1 and the height creates, 0, 0.25, 0.75,1

	*/
	Object.entries(keyframeWithoutOffset).forEach(
		([property, value]: [string, ValueOf<CustomKeyframeArrayValueSyntax>]) => {
			value?.forEach((entry: ValueOf<CustomKeyframe>, index: number) => {
				if (value.length === 1) {
					newKeyframes.at(-1)![property] = entry;
					return;
				}

				newKeyframes[index][property] = entry;
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
