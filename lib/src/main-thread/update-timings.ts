import { NormalizedProps, PropsWithRelativeTiming } from "../types";

export const getTotalRuntime = (props: NormalizedProps[]) =>
	props.reduce((accumulator, current) => {
		return accumulator + current.at + current.duration;
	}, 0);

export const getRelativeTimings = (
	props: NormalizedProps[],
	totalRuntime: number
): PropsWithRelativeTiming[] => {
	let currentTime = 0;

	return props.map((entry) => {
		const { duration, at, ...remainingOptions } = entry;

		const start = (currentTime = currentTime + at) / totalRuntime;
		const end = (currentTime = currentTime + duration) / totalRuntime;

		return {
			...remainingOptions,
			start,
			end,
		};
	});
};

export const computeCallbacks = (props: PropsWithRelativeTiming[]) => {
	const callbacks = new Map<number, VoidFunction[]>();
	const timings = new Set([0, ...props.map((entry) => entry.end)]);

	timings.forEach((currentTime) => {
		const relevantEntries = props.filter((entry) => entry.end <= currentTime);

		callbacks.set(currentTime, [...new Set(relevantEntries.map((entry) => entry.callback))]);
	});

	return callbacks;
};
