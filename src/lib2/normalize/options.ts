import { defaultOptions } from "../constants";
import { BewegungsOptions, EveryOptionSyntax } from "../types";

//TODO: delays are not recognized
const getTimingsFromKeyframe = (timing: Partial<BewegungsOptions>): BewegungsOptions => {
	const kfe = new KeyframeEffect(null, null, timing);
	const { composite, pseudoElement, iterationComposite } = kfe;

	return {
		...kfe.getComputedTiming(),
		composite,
		pseudoElement,
		iterationComposite,
		rootSelector: timing.rootSelector ?? "body",
	};
};

export const normalizeOptions = (option: EveryOptionSyntax): BewegungsOptions => {
	if (!option) {
		return getTimingsFromKeyframe(defaultOptions);
	}
	if (typeof option === "number") {
		return getTimingsFromKeyframe({ duration: option as number });
	}
	return getTimingsFromKeyframe(option as BewegungsOptions);
};
