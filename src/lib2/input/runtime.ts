export const calculateTotalRuntime = (times: number[]) =>
	times.reduce((longest, current) => Math.max(longest, current));
