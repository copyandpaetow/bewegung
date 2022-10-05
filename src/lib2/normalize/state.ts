import { scheduleCallback } from "../scheduler";
import {
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

export const fillState = (
	state: StructureOfChunks,
	props: CustomKeyframeEffect[]
) => {
	const targetArray: ElementOrSelector[] = [];
	const keyframeArray: EveryKeyframeSyntax[] = [];
	const optionsArray: EveryOptionSyntax[] = [];

	scheduleCallback(() =>
		props.forEach((propEntry) => {
			targetArray.push(propEntry[0]);
			keyframeArray.push(propEntry[1]);
			optionsArray.push(propEntry[2]);
		})
	);

	scheduleCallback(() =>
		makeMainState(state, { targetArray, keyframeArray, optionsArray })
	);
};

export const makeMainState = (state: StructureOfChunks, sortedProps: SoA) => {
	const { targetArray, keyframeArray, optionsArray } = sortedProps;

	targetArray.forEach((target) =>
		scheduleCallback(() => {
			state.elements.push(normalizeElements(target));
			state.selectors.push(typeof target === "string" ? target : "");
		})
	);

	optionsArray.forEach((option) => {
		scheduleCallback(() => {
			state.options.push(normalizeOptions(option));
		});
	});

	scheduleCallback(() => {
		keyframeArray
			.map(formatKeyframes)
			.map((keyframes, index) =>
				addIndividualEasing(keyframes, state.options[index])
			)
			.forEach((keyframe) => {
				const { keyframes: newKeyframes, callbacks: newCallbacks } =
					separateKeyframesAndCallbacks(keyframe);
				state.keyframes.push(newKeyframes);
				state.callbacks.push(newCallbacks);
			});
	});
};
