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
			throw new Error("keys need to be unique");
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
		return (
			this.#keyMap.has(keyOrValue as Key) ||
			this.#valueMap.has(keyOrValue as Value)
		);
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
