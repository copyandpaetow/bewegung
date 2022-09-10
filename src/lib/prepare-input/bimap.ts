export class BiMap<Key extends Object, Value extends Object> {
	#keyMap: Map<Key, Value>;
	#valueMap: WeakMap<Value, Set<Key>>;

	constructor(entries: [Key, Value][] = []) {
		this.#keyMap = new Map();
		this.#valueMap = new Map();

		entries.forEach(([key, value]) => {
			this.set(key, value);
		});
	}

	set(key: Key, value: Value) {
		if (this.#keyMap.has(key)) {
			throw new Error("keys need to be unique");
		}

		this.#keyMap.set(key, value);
		this.#valueMap.set(
			value,
			(this.#valueMap.get(value) || new Set()).add(key)
		);
	}

	getByKey(key: Key) {
		return this.#keyMap.get(key);
	}

	getByValue(valueKey: Value) {
		return this.#valueMap.has(valueKey)
			? Array.from(this.#valueMap.get(valueKey)!)
			: undefined;
	}

	hasByKey(key: Key) {
		return this.#keyMap.has(key);
	}

	hasByValue(value: Value) {
		return this.#valueMap.has(value);
	}

	deleteByKey(key: Key) {
		const value = this.getByKey(key);

		if (value !== undefined) {
			this.#valueMap.get(value)?.delete(key);
		}

		return this.#keyMap.delete(key);
	}

	deleteByValue(value: Value): Boolean {
		const key = this.getByValue(value);

		if (key !== undefined) {
			key.forEach((entry) => this.#keyMap.delete(entry));
		}

		return this.#valueMap.delete(value);
	}

	forEach(callbackFn: (value: Value, key: Key, map: Map<Key, Value>) => void) {
		this.#keyMap.forEach(callbackFn);
	}

	keys() {
		return Array.from(this.#keyMap.keys());
	}
}
