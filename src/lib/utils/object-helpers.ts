import { toArray } from "./array-helpers";

export const isObjectEmpty = <Obj extends Record<string, unknown>>(
	obj: Obj
): boolean => Object.keys(obj).length === 0;

export const filterEmptyObjectEntries = <Obj extends Record<string, any>>(
	filterableObject: Obj
): Obj | null => {
	const newObject = Object.entries(filterableObject).reduce(
		(accumulator, [key, value]) => {
			if (value) {
				return { ...accumulator, [key]: value };
			}
			return accumulator;
		},
		{} as Obj
	);

	return isObjectEmpty(newObject) ? null : newObject;
};

export const filterObject =
	<Obj extends Record<string, Value>, Value>(
		...filterRules: (([key, value]: [string, Value]) => boolean)[]
	) =>
	(objectToFilter: Obj) =>
		Object.fromEntries(
			Object.entries(objectToFilter).filter(([key, value]) =>
				filterRules
					.map((filterFunction) => filterFunction([key, value]))
					.every((conditionMet) => conditionMet)
			)
		);

export const splitObjectBy = <Obj extends Record<string, any>>(
	predicate: (entry: [string, any]) => string | string[],
	arrayOfObjects: Obj[]
) => {
	const splitValues = arrayOfObjects.reduce((accumulator, current, index) => {
		Object.entries(current).forEach((entry) => {
			toArray(predicate(entry)).forEach((groupingKey) => {
				accumulator[groupingKey] = accumulator[groupingKey] || [];
				accumulator[groupingKey][index] = {
					...accumulator[groupingKey][index],
					...Object.fromEntries([entry]),
				} || { ...Object.fromEntries([entry]) };
			});
		});

		return accumulator;
	}, {} as Record<string, Obj[]>);

	return Object.entries(splitValues).reduce((accumulator, current) => {
		const [key, value]: [string, Obj[]] = current;
		const filteredValue = value.filter((entry) => {
			if (!entry) {
				return false;
			}

			const entryKeys = Object.keys(entry);
			if (entryKeys.length < 1) {
				return false;
			}
			if (entryKeys.length === 1 && entry["offset"] !== undefined) {
				return false;
			}
			return true;
		});

		accumulator[key] = filteredValue.length ? filteredValue : null;

		return accumulator;
	}, {} as Record<string, Obj[] | null>);
};
