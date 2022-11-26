import { BewegungsOptions, State } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (options: Map<string, BewegungsOptions>) => {
	const runtimes: number[] = [];

	options.forEach((option) => {
		runtimes.push(option.endTime!);
	});

	return highestNumber(runtimes);
};
