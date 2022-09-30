import { BewegungProps, CustomKeyframe, CustomKeyframeEffect } from "../types";

const convertToCustomKeyframe = (kfe: KeyframeEffect): CustomKeyframeEffect => {
	const {
		target,
		getKeyframes,
		getComputedTiming,
		composite,
		pseudoElement,
		iterationComposite,
	} = kfe;

	if (!target || !pseudoElement) {
		throw new Error("nothing to animate");
	}

	return [
		target as HTMLElement,
		getKeyframes() as CustomKeyframe[],
		{ ...getComputedTiming(), composite, pseudoElement, iterationComposite },
	];
};

const isSingleArrayEntry = <Input>(input: Input) =>
	!Array.isArray(input) && !(input instanceof KeyframeEffect);

export const normalizeProps = (
	...props: BewegungProps
): CustomKeyframeEffect[] => {
	if (props instanceof KeyframeEffect) {
		return [convertToCustomKeyframe(props)];
	}

	if (props.some(isSingleArrayEntry)) {
		return [props] as CustomKeyframeEffect[];
	}

	return (props as (CustomKeyframeEffect | KeyframeEffect)[]).map((propEntry) =>
		propEntry instanceof KeyframeEffect
			? convertToCustomKeyframe(propEntry)
			: propEntry
	);
};
