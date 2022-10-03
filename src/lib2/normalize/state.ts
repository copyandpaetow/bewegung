import { scheduleCallback } from "../scheduler";
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

const makeState = (): StructureOfChunks => ({
	elements: [],
	keyframes: [],
	callbacks: [],
	options: [],
	selectors: [],
});

export const fillState = (props: CustomKeyframeEffect[]) =>
	new Promise<StructureOfChunks>((resolve) => {
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
			makeMainState({ targetArray, keyframeArray, optionsArray }, resolve)
		);
	});

export const makeMainState = (
	sortedProps: SoA,
	resolve: (value: StructureOfChunks | PromiseLike<StructureOfChunks>) => void
) => {
	const emptyState = makeState();
	const { targetArray, keyframeArray, optionsArray } = sortedProps;

	targetArray.forEach((target) =>
		scheduleCallback(() => {
			emptyState.elements.push(normalizeElements(target));
			emptyState.selectors.push(typeof target === "string" ? target : "");
		})
	);

	optionsArray.forEach((option) => {
		scheduleCallback(() => {
			emptyState.options.push(normalizeOptions(option));
		});
	});

	scheduleCallback(() => {
		keyframeArray
			.map(formatKeyframes)
			.map((keyframes, index) =>
				addIndividualEasing(keyframes, emptyState.options[index])
			)
			.forEach((keyframe) => {
				const { keyframes: newKeyframes, callbacks: newCallbacks } =
					separateKeyframesAndCallbacks(keyframe);
				emptyState.keyframes.push(newKeyframes);
				emptyState.callbacks.push(newCallbacks);
			});
	});

	scheduleCallback(() => {
		resolve(emptyState);
	});
};
