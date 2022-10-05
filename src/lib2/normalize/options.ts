import { defaultOptions } from "../constants";
import { BewegungsOptions, EveryOptionSyntax } from "../types";

const getTimingsFromKeyframe = (
	timing: Partial<KeyframeEffectOptions>
): KeyframeEffectOptions => {
	const kfe = new KeyframeEffect(null, null, timing);
	const { composite, pseudoElement, iterationComposite } = kfe;

	return {
		...kfe.getComputedTiming(),
		composite,
		pseudoElement,
		iterationComposite,
	};
};

export const normalizeOptions = (
	option: EveryOptionSyntax
): BewegungsOptions => {
	if (!option) {
		return getTimingsFromKeyframe(defaultOptions);
	}
	if (option === "number") {
		return getTimingsFromKeyframe({ duration: option as number });
	}
	return getTimingsFromKeyframe(option as BewegungsOptions);
};
