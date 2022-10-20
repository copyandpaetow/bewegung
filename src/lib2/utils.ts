// export class Store<Value> extends Set<Value> {
// 	add(...values: Value[]): this {
// 		values.forEach((value) => {
// 			super.add(value);
// 		});

// 		return this;
// 	}

// 	map<NewValue>(callbackFn: (value: Value, value2: Value, set: Set<Value>) => NewValue) {
// 		const results: NewValue[] = [];
// 		super.forEach((entry, entry2, set) => {
// 			results.push(callbackFn(entry, entry2, set));
// 		});
// 	}
// }

export const map = <Value, NewValue>(
	set: Set<Value>,
	callbackFn: (value: Value, value2: Value, set: Set<Value>) => NewValue
) => {
	const results: NewValue[] = [];
	set.forEach((entry, entry2, set) => {
		results.push(callbackFn(entry, entry2, set));
	});
	return results.flat();
};
