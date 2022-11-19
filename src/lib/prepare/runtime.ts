import { State } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const calculateTotalRuntime = (state: State) => {
	const { options, mainElements } = state;

	const allRuntimes = Array.from(mainElements)
		.flatMap((element) => options.get(element)!)
		.map((option) => option.endTime!);

	const totalRuntime = highestNumber(allRuntimes);

	state.totalRuntime = totalRuntime;
	state.timeKeeper.effect?.updateTiming({ duration: totalRuntime });
};
