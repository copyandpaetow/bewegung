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
