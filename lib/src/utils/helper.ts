const ROUNDING_FACTOR = 10000;

export const round = (number: number): number =>
	Math.round((number + Number.EPSILON) * ROUNDING_FACTOR) / ROUNDING_FACTOR;

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : round(value);
};

export const applyCSSStyles = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

function* idGeneratorFunction() {
	let index = 0;
	while (true) {
		yield (index += 1);
	}
}

const idGenerator = idGeneratorFunction();

export const uuid = (prefix: string = "bewegung"): string => {
	return `_${prefix}-${idGenerator.next().value}`;
};

export const nextRaf = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const querySelectorAll = (
	selector: string,
	element: HTMLElement = document.documentElement
) => {
	return Array.from(element.querySelectorAll(selector)) as HTMLElement[];
};

export const getChilden = (element: HTMLElement) => {
	return Array.from(element.children) as HTMLElement[];
};

export const transformProgress = (totalRuntime: number, progress: number, done?: boolean) => {
	return Math.min(Math.max(progress, 0.001), done === undefined ? 1 : 0.999) * totalRuntime;
};

export const execute = (callback: VoidFunction) => callback();
