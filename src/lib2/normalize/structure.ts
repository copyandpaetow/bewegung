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

export const normalizeProps = (entries: AnimationEntry[], ...props: BewegungProps) => {
	unifyPropStructure(...props).forEach((entry) => {
		const target = normalizeElements(entry[0]);
		const { keyframes, callbacks } = separateKeyframesAndCallbacks(
			unifyKeyframeStructure(entry[1])
		);
		const options = normalizeOptions(entry[2]);
		const updatedKeyframes = addIndividualEasing(keyframes, options);
		const selector = typeof entry[0] === "string" ? entry[0] : "";

		entries.push({ target, keyframes: updatedKeyframes, callbacks, options, selector });
	});
};
