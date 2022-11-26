import { defaultOptions } from "../constants";
import { BewegungsOptions, CustomKeyframeEffect, EveryOptionSyntax } from "../types";

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

export const getOptions = (normalizedProps: CustomKeyframeEffect[], chunkIDs: string[]) => {
	const options = new Map<string, BewegungsOptions>();

	normalizedProps.forEach((propEntry, index) => {
		const option = normalizeOptions(propEntry[2]);
		const chunkID = chunkIDs[index];

		options.set(chunkID, option);
	});

	return options;
};
