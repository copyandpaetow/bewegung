import { CustomKeyframeEffect, CustomKeyframe, BewegungProps } from "../types";
import { normalizeElements } from "./normalize-elements";

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

export const unifyPropStructure = (props: BewegungProps): CustomKeyframeEffect[] => {
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

export const updateUserInput = (
	userInput: CustomKeyframeEffect[],
	removedElements: HTMLElement[],
	addedElements: HTMLElement[]
): CustomKeyframeEffect[] => {
	return userInput.map((entry) => {
		const [targets, keyframe, options] = entry;
		if (typeof targets === "string") {
			return entry;
		}

		const updatedTargets = normalizeElements(targets)
			.filter((element) => !removedElements.includes(element))
			.concat(...addedElements);

		return [updatedTargets, keyframe, options];
	});
};
