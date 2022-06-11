import { VoidCallback } from "../types";

export const iterateWeakMap =
	<Value>(
		elements: HTMLElement[] | Set<HTMLElement>,
		weakMap: WeakMap<HTMLElement, Value>
	) =>
	(
		callback: (
			value: Value,
			key: HTMLElement,
			weakMap: WeakMap<HTMLElement, Value>
		) => void
	) => {
		return Array.from(elements).forEach((element) => {
			const value = weakMap.get(element)!;
			callback(value, element, weakMap);
		});
	};

export const execute =
	(...callbacks: Function[]) =>
	() =>
		callbacks.forEach((callback) => callback());
