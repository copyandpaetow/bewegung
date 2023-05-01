export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : value;
};

export const applyCSSStyles = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

export const styleReset = (
	element: HTMLElement,
	style: Partial<CSSStyleDeclaration>
): Partial<CSSStyleDeclaration> => {
	return Object.fromEntries(
		Object.keys(style).map((property) => {
			return [property, element.style[property] ?? ""];
		})
	);
};

export const emptyStyleReset = (
	style: Partial<CSSStyleDeclaration>
): Partial<CSSStyleDeclaration> => {
	return Object.fromEntries(
		Object.keys(style).map((property) => {
			return [property, ""];
		})
	);
};

export const resolveable = () => {
	const api = {
		resolve(value: any) {},
		reject(value: any) {},
	};
	const promise = new Promise<void>((res, rej) => {
		api.resolve = res;
		api.reject = rej;
	});

	return { ...api, promise };
};
