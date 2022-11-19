import { BewegungsOptions, Callbacks, CustomKeyframe, State } from "../types";

//?: if the lastOffset is equal to the newOffset, their keyframes will get mashed together eventually
// with newOffset === lastOffset ? newOffset + 0.0001 : newOffset, this could be avoided but it creates a flicker and doesnt look that great
const updateOffsets = (
	entry: CustomKeyframe[] | Callbacks[],
	options: BewegungsOptions,
	totalRuntime: number
): CustomKeyframe[] | Callbacks[] => {
	const { duration: untypedDuration, delay: start, endDelay, iterations, direction } = options;
	const duration = untypedDuration as number;
	if (iterations === Infinity) {
		throw new Error("cant calculate with Infinity");
	}

	const updatedFrames: CustomKeyframe[] | Callbacks[] = [];
	const reversedEntry: CustomKeyframe[] | Callbacks[] = [...entry].reverse();

	Array.from(Array(iterations), (_, iteration) => {
		const lastIterationOffset = (start! + duration * iteration - endDelay!) / totalRuntime ?? 0;

		entry.forEach((frame, index) => {
			const isForward =
				direction === "normal" ||
				(direction === "alternate" && index % 2 === 0) ||
				(direction === "alternate-reverse" && index % 2 !== 0);

			const offsetWithDirection = (isForward ? frame : reversedEntry[index]).offset as number;
			const newOffset =
				(start! + (duration * offsetWithDirection)! - endDelay!) / totalRuntime +
				lastIterationOffset;

			//@ts-expect-error
			updatedFrames.push({
				...frame,
				offset: newOffset,
			});
		});
	});

	return updatedFrames;
};

export const updateKeyframeOffsets = (state: State, previousRuntime: number) => {
	const { mainElements, options, keyframes, totalRuntime } = state;

	if (totalRuntime === previousRuntime) {
		return;
	}

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = keyframes
			.get(element)!
			.map((frame, index) => updateOffsets(frame, option[index], totalRuntime));
		keyframes.set(element, currentValue);
	});
};

export const updateCallbackOffsets = (state: State, previousRuntime: number) => {
	const { mainElements, options, callbacks, totalRuntime } = state;

	if (totalRuntime === previousRuntime) {
		return;
	}

	mainElements.forEach((element) => {
		const option = options.get(element)!;
		const currentValue = callbacks
			.get(element)!
			.map((callback, index) => updateOffsets(callback, option[index], totalRuntime));
		callbacks.set(element, currentValue as Callbacks[][]);
	});
};
