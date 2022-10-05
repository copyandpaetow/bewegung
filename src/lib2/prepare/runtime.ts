import { BewegungsOptions, Context } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (
	context: Context,
	options: BewegungsOptions[]
) => {
	context.totalRuntime = highestNumber(
		options.map((option) => option.endTime!)
	);
};
