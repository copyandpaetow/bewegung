import { Deferred, ElementReadouts, Result, ValueOf } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const checkForBorderRadius = (entry: ElementReadouts) => entry.borderRadius !== "0px";

export const checkForDisplayInline = (entry: ElementReadouts) => entry.display === "inline";

export const checkForDisplayNone = (entry: ElementReadouts) => entry.display === "none";

export const isEntryVisible = (entry: ElementReadouts) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveWidth !== 0;

export const checkForPositionStatic = (entry: ElementReadouts) => entry.position === "static";

export const compareOffsetObjects = <Value>(
	a: Record<string, Value>,
	b: Record<string, Value>
): boolean =>
	Object.entries(a).every(([key, value]) => {
		if (key === "offset") {
			return true;
		}

		return b[key] === value;
	});

export const isElement = (node: Node): boolean => node instanceof HTMLElement;

export const toArray = <MaybeArrayType>(
	maybeArray: MaybeArrayType | MaybeArrayType[]
): MaybeArrayType[] => (Array.isArray(maybeArray) ? maybeArray : [maybeArray]);

export const deferred = (): Deferred => {
	let resolve = (value: Result | PromiseLike<Result>) => {};
	const promise = new Promise<Result>((res) => (resolve = res));

	return {
		promise,
		resolve,
	};
};

export const throttle = () => {
	let delayedCallback: NodeJS.Timeout | undefined;
	const clear = () => delayedCallback && clearTimeout(delayedCallback);

	return {
		fn(callback: VoidFunction) {
			clear();
			delayedCallback = setTimeout(() => {
				callback();
			}, 100);
		},
		clear,
	};
};
