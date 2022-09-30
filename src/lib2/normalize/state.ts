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
import {
	addIndividualEasing,
	formatKeyframes,
	separateKeyframesAndCallbacks,
} from "./keyframes";
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
	const selectors: string[] = new Array(targetArray.length).fill("");
	const callbacks: Callbacks[][] = [];
	const elements = targetArray.map((target, index) =>
		normalizeElements(
			target,
			(selector: string) => (selectors[index] = selector)
		)
	);
	const options = optionsArray.map(normalizeOptions);
	const keyframes = keyframeArray
		.map(formatKeyframes)
		.map((keyframes, index) => addIndividualEasing(keyframes, options[index]))
		.map((keyframe, index) =>
			separateKeyframesAndCallbacks(keyframe, (callback: Callbacks) => {
				if (!callbacks[index]) {
					callbacks[index] = [];
				}

				callbacks[index].push(callback);
			})
		);

	return { elements, keyframes, callbacks, options, selectors };
};
