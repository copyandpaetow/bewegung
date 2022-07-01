let activeEffect: (() => void) | undefined;

export function effect(effectCallback) {
	let result;
	const effect = () => {
		activeEffect = effect;

		result = effectCallback();

		activeEffect = undefined;

		return () => result;
	};

	effect();

	return () => result;
}

export const observerable = <Value>(value: Value) => {
	let innerValue = value;
	const dependencies = new Set<() => void>();

	return (updatedValue?: Value) => {
		if (updatedValue) {
			innerValue = updatedValue;

			dependencies.forEach((callback) => callback());
			return innerValue;
		}
		activeEffect && dependencies.add(activeEffect);
		return innerValue;
	};
};
