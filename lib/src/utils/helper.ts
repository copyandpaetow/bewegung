const ROUNDING_FACTOR = 10000;

export const round = (number: number): number =>
	Math.round((number + Number.EPSILON) * ROUNDING_FACTOR) / ROUNDING_FACTOR;

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : round(value);
};

export const applyCSSStyles = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

let count = 0;
export const uuid = (prefix: string): string => {
	count += 1;
	return `_${prefix}-${count}`;
};

export const nextRaf = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const querySelectorAll = (
	selector: string,
	element: HTMLElement = document.documentElement
) => {
	return Array.from(element.querySelectorAll(selector)) as HTMLElement[];
};

export const getDebounce = (duration = 200) => {
	let resizeIdleCallback = 0;

	return (callback: VoidFunction) => {
		window.clearTimeout(resizeIdleCallback);
		resizeIdleCallback = window.setTimeout(() => {
			callback();
		}, duration);
	};
};

export const saveSeek = (amount: number) => Math.max(0.0001, Math.min(0.9999, amount));
