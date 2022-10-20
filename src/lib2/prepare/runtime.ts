import { BewegungsOptions, Context } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (
	options: BewegungsOptions[],
	totalRuntime: (update?: number | undefined) => number
): boolean => {
	const currentRuntime = totalRuntime();
	const highestRuntime = highestNumber(options.map((option) => option.endTime!));

	if (highestRuntime <= currentRuntime) {
		return false;
	}
	totalRuntime(highestRuntime);
	return true;
};

export const runtime = (value: number) => {
	let innerValue = value;

	return (update?: number): number => {
		if (update) {
			innerValue = update;
		}

		return innerValue;
	};
};
