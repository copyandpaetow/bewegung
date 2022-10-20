import { BewegungsOptions, Context, State } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (state: State) => {
	const { options, mainElements } = state;

	const allRuntimes = Array.from(mainElements)
		.flatMap((element) => options.get(element)!)
		.map((option) => option.endTime!);

	state.totalRuntime = highestNumber(allRuntimes);
};
