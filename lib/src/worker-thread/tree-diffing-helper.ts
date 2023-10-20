import { DimensionalDifferences, ObjectFit, TreeElement, TreeRepresentation } from "../types";
import { calculateDifferences, calculateDifferencesWithParentCorrection } from "./differences";

export const hasDifferentChildren = (
	oldChildren: Map<string, TreeRepresentation>,
	newChildren: Map<string, TreeRepresentation>
) => {
	let childrenDiffer = false;

	if (oldChildren.size !== newChildren.size) {
		return true;
	}

	newChildren.forEach((_, key) => {
		if (oldChildren.has(key)) {
			return;
		}
		childrenDiffer = true;
	});

	return childrenDiffer;
};

export const getDifferences = (current: TreeElement[], parent: TreeElement[] | undefined) => {
	if (!parent) {
		return current.map((entry) =>
			calculateDifferences({
				current: entry,
				reference: current.at(-1)!,
			})
		);
	}

	return current.map((entry, index) =>
		calculateDifferencesWithParentCorrection({
			current: entry,
			reference: current.at(-1)!,
			parent: parent![index],
			parentReference: parent!.at(-1)!,
		})
	);
};

export const isSpecialImageElement = (dimensions: TreeElement[]) => {
	const hasObjectFit = dimensions.some((entry) => entry.objectFit !== ObjectFit.fill);

	if (!hasObjectFit) {
		return false;
	}

	const { heightDifference, widthDifference } = calculateDifferences({
		current: dimensions.at(0)!,
		reference: dimensions.at(-1)!,
	});

	return heightDifference !== widthDifference;
};

export const hasElementChanged = (differences: DimensionalDifferences[]) =>
	differences.some(
		(entry) =>
			entry.leftDifference !== 0 ||
			entry.topDifference !== 0 ||
			entry.widthDifference !== 1 ||
			entry.heightDifference !== 1
	);

export const saveTreeValue = (tree: TreeRepresentation) => {
	const dimensions = tree[0] as TreeElement;

	return [
		{
			...dimensions,
			unsaveHeight: 0,
			unsaveWidth: 0,
			offset: dimensions.offset ? 0 : 1,
		},
		[],
	];
};

export const getChildrenStores = (oldDom: TreeRepresentation, newDom: TreeRepresentation) => {
	const oldChildrenStore = new Map<string, TreeRepresentation>();
	const newChildrenStore = new Map<string, TreeRepresentation>();

	(oldDom[1] as TreeRepresentation[]).forEach((oldChild) => {
		oldChildrenStore.set((oldChild[0] as TreeElement).key, oldChild);
	});

	(newDom[1] as TreeRepresentation[]).forEach((newChild) => {
		newChildrenStore.set((newChild[0] as TreeElement).key, newChild);
	});

	return { oldChildrenStore, newChildrenStore };
};
