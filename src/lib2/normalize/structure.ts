import { scheduleCallback } from "../scheduler";
import { AnimationEntry, BewegungProps, CustomKeyframe, CustomKeyframeEffect } from "../types";
import { normalizeElements } from "./elements";
import {
	addIndividualEasing,
	separateKeyframesAndCallbacks,
	unifyKeyframeStructure,
} from "./keyframes";
import { normalizeOptions } from "./options";

const convertToCustomKeyframe = (kfe: KeyframeEffect): CustomKeyframeEffect => {
	const { target, getKeyframes, getComputedTiming, composite, pseudoElement, iterationComposite } =
		kfe;

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

const initalAnimationEntry = (): AnimationEntry => ({
	target: [],
	keyframes: [],
	callbacks: [],
	selector: "",
	options: { rootSelector: "" },
});

export const normalizeProps = (entries: AnimationEntry[], ...props: BewegungProps) => {
	unifyPropStructure(...props).forEach((entry) => {
		const animationEntry = initalAnimationEntry();

		const tasks = [
			() => (animationEntry.target = normalizeElements(entry[0])),
			() => (animationEntry.options = normalizeOptions(entry[2])),
			() => (animationEntry.selector = typeof entry[0] === "string" ? animationEntry.selector : ""),
			() => separateKeyframesAndCallbacks(animationEntry, unifyKeyframeStructure(entry[1])),
			() => addIndividualEasing(animationEntry),
			() => entries.push(animationEntry),
		];

		tasks.forEach(scheduleCallback);
	});
};
