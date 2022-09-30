import { BewegungsOptions } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (options: BewegungsOptions[]): number =>
	highestNumber(options.map((option) => option.endTime!));
