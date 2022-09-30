import { defaultTimings } from "../constants";
import { EveryOptionSyntax } from "../types";

export const normalizeOptions = (
	option: EveryOptionSyntax
): KeyframeEffectOptions => {
	if (!option) {
		return defaultTimings;
	}
	if (option === "number") {
		return { ...defaultTimings, duration: option as number };
	}
	return { ...defaultTimings, ...(option as KeyframeEffectOptions) };
};
