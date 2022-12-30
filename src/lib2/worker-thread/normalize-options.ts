import { defaultOptions } from "../shared/constants";
import { BewegungsOptions, EveryOptionSyntax } from "../types";

export const normalizeOptions = (allOptions: EveryOptionSyntax[]): BewegungsOptions[] =>
	allOptions.map((options) => {
		//TODO: this could be clearer
		const userOptions = !options
			? {}
			: typeof options === "number"
			? { duration: options }
			: options;

		const input = {
			...defaultOptions,
			...userOptions,
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
	});
