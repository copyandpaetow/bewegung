import { CustomKeyframe, CustomKeyframeArrayValueSyntax, EveryKeyframeSyntax } from "../types";

const addOffsetToKeyframe = (
	keyframes: CustomKeyframe[],
	offsets: number[] | undefined
): CustomKeyframe[] => {
	if (!offsets || offsets.length === 0) {
		return keyframes.map((keyframe, index, array) => {
			const step = index / (array.length - 1);
			const isFirstElement = index === 0 ? 0 : undefined;
			const isSingularKeyframe = keyframes.length === 1 ? 1 : undefined;

			return {
				...keyframe,
				offset: isSingularKeyframe ?? isFirstElement ?? step,
			};
		});
	}
	//TODO: this is still flawed
	if (keyframes.length <= offsets.length || offsets.at(-1) === 1) {
		return keyframes.map((keyframe, index) => ({
			...keyframe,
			offset: offsets[index] ?? 1,
		}));
	}
	const lastOffset = offsets.at(-1)!;
	const lengthDifference = keyframes.length - offsets.length;
	const step = (1 - lastOffset) / lengthDifference;

	return keyframes.map((keyframe, index) => {
		const nextOffset = lastOffset + step * (index + 1 - offsets.length);
		return {
			...keyframe,
			offset: offsets[index] ?? nextOffset,
		};
	});
};

const formatArraySyntax = (
	keyframeWithArraySyntax: CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	const { offset, ...remainingKeyframes } = keyframeWithArraySyntax;
	const newKeyframes = new Map<number, CustomKeyframe>();

	Object.entries(remainingKeyframes).forEach(([key, value]) => {
		const translated = value!.map((entry) => ({ [key]: entry } as CustomKeyframe));
		addOffsetToKeyframe(translated, offset).forEach((entry) =>
			newKeyframes.set(entry.offset!, { ...(newKeyframes.get(entry.offset!) ?? {}), ...entry })
		);
	});

	return Array.from(newKeyframes.values());
};

const notEmpty = <Value>(value: Value | null | undefined): value is Value =>
	value !== null && value !== undefined;

const addKeyframeOffset = (allKeyframes: CustomKeyframe[]): CustomKeyframe[] => {
	const offsets = allKeyframes.map((keyframe) => keyframe.offset).filter(notEmpty);

	return addOffsetToKeyframe(allKeyframes, offsets);
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
