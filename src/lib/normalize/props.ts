import { initialPropState } from "../initial-states";
import { scheduleCallback } from "../scheduler";
import { AnimationEntry, BewegungProps, CustomKeyframe, CustomKeyframeEffect } from "../types";
import { normalizeElements } from "./elements";
import {
	addIndividualEasing,
	separateKeyframesAndCallbacks,
	unifyKeyframeStructure,
} from "./keyframes";
import { normalizeOptions } from "./options";

const convertToCustomKeyframe = (keyframeEffect: KeyframeEffect): CustomKeyframeEffect => {
	const { target, getKeyframes, getComputedTiming, composite, pseudoElement, iterationComposite } =
		keyframeEffect;

	if (!target || !pseudoElement) {
		throw new Error("nothing to animate");
	}

	return [
		target as HTMLElement,
		getKeyframes() as CustomKeyframe[],
		{ ...getComputedTiming(), composite, pseudoElement, iterationComposite, rootSelector: "body" },
	];
};

const isSingleArrayEntry = <Input>(input: Input) =>
	!Array.isArray(input) && !(input instanceof KeyframeEffect);

const unifyPropStructure = (...props: BewegungProps): CustomKeyframeEffect[] => {
	if (props instanceof KeyframeEffect) {
		return [convertToCustomKeyframe(props)];
	}

	if (props.some(isSingleArrayEntry)) {
		return [props] as CustomKeyframeEffect[];
	}

	return (props as (CustomKeyframeEffect | KeyframeEffect)[]).map((propEntry) =>
		propEntry instanceof KeyframeEffect ? convertToCustomKeyframe(propEntry) : propEntry
	);
};

export const normalizeProps = (entries: AnimationEntry[], ...props: BewegungProps) => {
	unifyPropStructure(...props).forEach((entry) => {
		const propState = initialPropState();

		const tasks = [
			() => (propState.target = normalizeElements(entry[0])),
			() => (propState.options = normalizeOptions(entry[2])),
			() => (propState.selector = typeof entry[0] === "string" ? propState.selector : ""),
			() => separateKeyframesAndCallbacks(propState, unifyKeyframeStructure(entry[1])),
			() => addIndividualEasing(propState),
			() => entries.push(propState),
		];

		tasks.forEach(scheduleCallback);
	});
};
