export const iterateMap = <MapKey, MapValue, NewValue>(
	mappingFn: (
		value: MapValue,
		key: MapKey,
		currentMap: Map<MapKey, MapValue>
	) => NewValue | false,
	oldMap: Map<MapKey, MapValue>
) => {
	const newMap = new Map<MapKey, NewValue>();
	oldMap.forEach((value, key) => {
		const newValue = mappingFn(value, key, oldMap);
		if (newValue) {
			newMap.set(key, newValue);
		}
	});
	return newMap;
};
