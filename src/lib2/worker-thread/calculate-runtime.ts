import { highestNumber } from "../shared/utils";
import { NormalizedCustomKeyframeEffect } from "../types";

export const updateTotalRuntime = (options: NormalizedCustomKeyframeEffect[]) => {
	const runtimes = options.map((customKeyframeEffect) => customKeyframeEffect[2].endTime!);

	return highestNumber(runtimes);
};
