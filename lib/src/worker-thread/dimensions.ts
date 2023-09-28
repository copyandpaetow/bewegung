import { TreeRepresentation, TreeElement } from "../types";
import { isEntryVisible } from "../utils/predicates";

export const updateDimensions = (
	domTree: TreeRepresentation,
	dimensionStore = new Map<string, TreeElement>()
) => {
	const [current, currentChildren] = domTree as TreeRepresentation;
	const key = (current as TreeElement).key;

	dimensionStore.set(key, current as TreeElement);

	(currentChildren as TreeRepresentation).forEach((child) =>
		updateDimensions(child as TreeRepresentation, dimensionStore)
	);

	return dimensionStore;
};

export const getDimensions = (
	current: TreeElement,
	dimensionStore: Map<string, TreeElement>
): [TreeElement, TreeElement] => {
	const previousDimensions =
		dimensionStore.get(current.key) ??
		({
			...current,
			unsaveHeight: 0,
			unsaveWidth: 0,
			offset: 0,
		} as TreeElement);

	const currentDimensions = isEntryVisible(current as TreeElement)
		? (current as TreeElement)
		: ({
				...previousDimensions,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset: 1,
		  } as TreeElement);

	return [previousDimensions, currentDimensions];
};

export const getParentDimensions = (
	parentNode: TreeRepresentation | undefined,
	dimensionStore: Map<string, TreeElement>
): [TreeElement, TreeElement] | undefined => {
	if (!parentNode) {
		return;
	}
	const parentKey = (parentNode[0] as TreeElement).key;

	if (!dimensionStore.has(parentKey)) {
		return;
	}

	return [dimensionStore.get(parentKey)!, parentNode[0] as TreeElement];
};

export const setDelayedStatus = (
	dimensions: [TreeElement, TreeElement],
	delayedStore: Set<string>
) => {
	if (dimensions.every((entry) => entry.visibility)) {
		return;
	}

	delayedStore.add(dimensions[0].key);
};
