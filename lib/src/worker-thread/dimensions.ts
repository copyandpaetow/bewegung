import { DomRepresentation, TreeEntry } from "../types";
import { isEntryVisible } from "../utils/predicates";

export const updateDimensions = (
	domTree: DomRepresentation,
	dimensionStore: Map<string, TreeEntry>
) => {
	const [current, currentChildren] = domTree as DomRepresentation;
	const key = (current as TreeEntry).key;

	dimensionStore.set(key, current as TreeEntry);

	(currentChildren as DomRepresentation).forEach((child) =>
		updateDimensions(child as DomRepresentation, dimensionStore)
	);
};

export const getDimensions = (
	current: TreeEntry,
	dimensionStore: Map<string, TreeEntry>
): [TreeEntry, TreeEntry] => {
	const previousDimensions =
		dimensionStore.get(current.key) ??
		({
			...current,
			unsaveHeight: 0,
			unsaveWidth: 0,
			offset: 0,
		} as TreeEntry);

	const currentDimensions = isEntryVisible(current as TreeEntry)
		? (current as TreeEntry)
		: ({
				...previousDimensions,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset: 1,
		  } as TreeEntry);

	return [previousDimensions, currentDimensions];
};

export const getParentDimensions = (
	parentNode: DomRepresentation | undefined,
	dimensionStore: Map<string, TreeEntry>
): [TreeEntry, TreeEntry] | undefined => {
	if (!parentNode) {
		return;
	}
	const parentKey = (parentNode[0] as TreeEntry).key;

	if (!dimensionStore.has(parentKey)) {
		return;
	}

	return [dimensionStore.get(parentKey)!, parentNode[0] as TreeEntry];
};
