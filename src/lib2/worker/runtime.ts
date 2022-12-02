import { BewegungsOptions, State } from "../types";
import { highestNumber } from "../utils";

export const calculateTotalRuntime = (options: Map<string, BewegungsOptions>) => {
	const runtimes: number[] = [];

	options.forEach((option) => {
		runtimes.push(option.endTime!);
	});

	return highestNumber(runtimes);
};
