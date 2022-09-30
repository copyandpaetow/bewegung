import {
	Callbacks,
	CustomKeyframeEffect,
	ElementOrSelector,
	EveryKeyframeSyntax,
	EveryOptionSyntax,
	SoA,
	StructureOfChunks,
} from "../types";
import { normalizeElements } from "./elements";
import { formatKeyframes, separateKeyframesAndCallbacks } from "./keyframes";
import { normalizeOptions } from "./options";

export const toSoA = (props: CustomKeyframeEffect[]): SoA => {
	const targetArray: ElementOrSelector[] = [];
	const keyframeArray: EveryKeyframeSyntax[] = [];
	const optionsArray: EveryOptionSyntax[] = [];

	props.forEach((propEntry) => {
		targetArray.push(propEntry[0]);
		keyframeArray.push(propEntry[1]);
		optionsArray.push(propEntry[2]);
	});

	return { targetArray, keyframeArray, optionsArray };
};

export const makeMainState = ({
	targetArray,
	keyframeArray,
	optionsArray,
}: SoA): StructureOfChunks => {
	const empty = new Array(targetArray.length).fill(null) as null[];
	const selectors: (string | null)[] = empty;
	const callbacks: (Callbacks[] | null)[] = empty;
	const elements = targetArray.map((target, index) => {
		if (typeof target === "string") {
			selectors[index] = target;
		}
		return normalizeElements(target);
	});
	const options = optionsArray.map(normalizeOptions);
	const keyframes = keyframeArray
		.map(formatKeyframes)
		.map((keyframe, index) => {
			const { keyframes, callbacks: possibleCallbacks } =
				separateKeyframesAndCallbacks(keyframe, options[index]);
			if (possibleCallbacks.length) {
				callbacks[index] = possibleCallbacks;
			}

			return keyframes;
		});

	return { elements, keyframes, callbacks, options, selectors };
};
