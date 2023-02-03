import { defaultOptions } from "../shared/constants";
import { BewegungsOptions, EveryOptionSyntax } from "../types";

const getUserOptions = (options: EveryOptionSyntax) => {
	if (!options) {
		return {};
	}
	if (typeof options === "number") {
		return { duration: options };
	}

	return options;
};

export const normalizeOptions = (options: EveryOptionSyntax): BewegungsOptions => {
	const input = {
		...defaultOptions,
		...getUserOptions(options),
	};

	const activeDuration = Number(input.duration) * input.iterations!;
	const endTime = activeDuration + input.delay! + input.endDelay!;

	return {
		...input,
		activeDuration,
		currentIteration: null,
		endTime,
		localTime: null,
		progress: null,
	};
};
