export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : value;
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
	return `${prefix}-${idGenerator.next().value}`;
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

export const toArray = <MaybeArrayType>(
	maybeArray: MaybeArrayType | MaybeArrayType[]
): MaybeArrayType[] => (Array.isArray(maybeArray) ? maybeArray : [maybeArray]);
