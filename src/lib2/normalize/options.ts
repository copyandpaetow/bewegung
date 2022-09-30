import { defaultTimings } from "../constants";
import { BewegungsOptions, EveryOptionSyntax } from "../types";

export const normalizeOptions = (
	option: EveryOptionSyntax
): BewegungsOptions => {
	if (!option) {
		return defaultTimings;
	}
	if (option === "number") {
		return { ...defaultTimings, duration: option as number };
	}
	return { ...defaultTimings, ...(option as BewegungsOptions) };
};
