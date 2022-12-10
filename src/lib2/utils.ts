import { ElementReadouts } from "./types";

export const uuid = (prefix: string = "bewegung"): string => {
	return prefix + "-" + Math.random().toString(36).substring(2, 15);
};

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export class BidirectionalMap<Key, Value> {
	#keyMap: Map<Key, Value>;
	#valueMap: Map<Value, Key>;

	constructor(entries: [Key, Value][] = []) {
		this.#keyMap = new Map();
		this.#valueMap = new Map();

		entries.forEach(([key, value]) => {
			this.set(key, value);
		});
	}

	set(key: Key, value: Value) {
		if (this.has(key) || this.has(value)) {
			const keyValue = this.#keyMap.get(key);
			const valueKey = this.#valueMap.get(value);

			if (key === valueKey && value === keyValue) {
				return;
			}

			throw new Error("can not re-assign keys");
		}

		this.#keyMap.set(key, value);
		this.#valueMap.set(value, key);
	}
	get(keyOrValue: Key): Value | undefined;
	get(keyOrValue: Value): Key | undefined;
	get(keyOrValue: Key | Value): Key | Value | undefined {
		if (this.#keyMap.has(keyOrValue as Key)) {
			return this.#keyMap.get(keyOrValue as Key);
		}
		if (this.#valueMap.has(keyOrValue as Value)) {
			return this.#valueMap.get(keyOrValue as Value);
		}
		return undefined;
	}

	has(keyOrValue: Key | Value): boolean {
		return this.#keyMap.has(keyOrValue as Key) || this.#valueMap.has(keyOrValue as Value);
	}

	delete(keyOrValue: Key | Value) {
		if (this.#keyMap.has(keyOrValue as Key)) {
			const value = this.#keyMap.get(keyOrValue as Key)!;
			this.#keyMap.delete(keyOrValue as Key);
			this.#valueMap.delete(value);

			return true;
		}

		if (this.#valueMap.has(keyOrValue as Value)) {
			const key = this.#valueMap.get(keyOrValue as Value)!;
			this.#valueMap.delete(keyOrValue as Value);
			this.#keyMap.delete(key);

			return true;
		}
		return false;
	}

	forEach(callbackFn: (value: Value, key: Key, map: Map<Key, Value>) => void) {
		this.#keyMap.forEach(callbackFn);
	}
}

export const checkForBorderRadius = (entry: ElementReadouts) =>
	entry.computedStyle.borderRadius !== "0px";

export const checkForDisplayInline = (entry: ElementReadouts) =>
	entry.computedStyle.display === "inline";

export const checkForDisplayNone = (entry: ElementReadouts) =>
	entry.computedStyle.display === "inline";

export const checkForPositionStatic = (entry: ElementReadouts) =>
	entry.computedStyle.position === "static";

export const Queue = <Type>(callback: (current: Type) => void) => {
	const queue: Type[] = [];
	let isRunning = false;

	const run = async () => {
		isRunning = true;

		while (queue.length) {
			callback(queue.shift()!);
		}

		isRunning = false;
	};

	return (entry: Type) => {
		queue.push(entry);

		if (isRunning) {
			return;
		}
		run();
	};
};
