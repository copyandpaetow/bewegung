import { NormalizedCustomKeyframeEffect, WorkerState } from "../types";
import { highestNumber } from "../shared/utils";

export const updateTotalRuntime = (
	state: WorkerState,
	options: NormalizedCustomKeyframeEffect[]
) => {
	const runtimes = options.map((customKeyframeEffect) => customKeyframeEffect[2].endTime!);

	state.totalRuntime = Math.max(highestNumber(runtimes), state.totalRuntime);
};
