export const sortNumbers = (array: number[]): number[] =>
	array.sort((a, b) => a - b);

export const round = (num: number) =>
	Math.round((num + Number.EPSILON) * 1000) / 1000;

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value)
		? alternative
		: value;
};

export const clamp = (number: number, min = 0, max = 1) =>
	Math.min(Math.max(number, min), max);
