import { BewegungsOptions } from "../types";
import { highestNumber } from "../utils";

export const calculateTotalRuntime = (options: BewegungsOptions[]) => {
	const runtimes = options.map((option) => option.endTime!);

	return highestNumber(runtimes);
};
