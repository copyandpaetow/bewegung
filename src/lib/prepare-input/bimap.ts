export class BiMap<Key, Value> {
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
		this.delete(key);
		this.delete(value);
		this.#keyMap.set(key, value);
		this.#valueMap.set(value, key);
	}

	get(keyOrValue: Key): Value | undefined;
	get(keyOrValue: Value): Key | undefined;
	get(keyOrValue: Key | Value): Key | Value | undefined {
		return (
			this.#keyMap.get(keyOrValue as Key) ||
			this.#valueMap.get(keyOrValue as Value)
		);
	}

	has(keyOrValue: Key | Value) {
		return (
			this.#keyMap.has(keyOrValue as Key) ||
			this.#valueMap.has(keyOrValue as Value)
		);
	}

	delete(keyOrValue: Key | Value): Boolean {
		//@ts-expect-error
		const returnValue = this.get(keyOrValue);

		if (returnValue !== undefined) {
			this.#keyMap.delete(returnValue as Key);
			this.#valueMap.delete(returnValue as Value);
		}

		return [
			this.#keyMap.delete(keyOrValue as Key),
			this.#valueMap.delete(keyOrValue as Value),
		].some(Boolean);
	}

	forEach(callbackFn: (value: Value, key: Key, map: Map<Key, Value>) => void) {
		this.#keyMap.forEach(callbackFn);
	}

	keys() {
		return Array.from(this.#keyMap.keys());
	}

	values() {
		return Array.from(this.#valueMap.keys());
	}
}
