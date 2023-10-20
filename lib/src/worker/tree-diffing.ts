import { DomDiffCallback, TreeElement, TreeRepresentation } from "../types";
import {
	getChildrenStores,
	getDifferences,
	hasDifferentChildren,
	hasElementChanged,
	isSpecialImageElement,
	saveTreeValue,
} from "./tree-diffing-helper";
import { isEntryVisible } from "./worker-helper";

export const diffDomTrees = (
	oldDom: TreeRepresentation,
	newDom: TreeRepresentation,
	callback: DomDiffCallback,
	parentDimensions?: [TreeElement, TreeElement]
) => {
	const dimensions: [TreeElement, TreeElement] = [
		oldDom[0] as TreeElement,
		newDom[0] as TreeElement,
	];

	//if both entries are hidden, the element was hidden in general and doesnt need any animations as well as their children
	if (dimensions.every((entry) => !isEntryVisible(entry))) {
		return;
	}

	const differences = getDifferences(dimensions, parentDimensions);
	const { oldChildrenStore, newChildrenStore } = getChildrenStores(oldDom, newDom);

	//if the element doesnt really change in the animation, we just skip it and continue with the children
	//we cant skip the whole tree because a decendent could still shrink
	//also inline elements cant be transformed (except replaceable elements such as img, video, canvas)

	const shouldBeAnimated =
		hasElementChanged(differences) ||
		hasDifferentChildren(oldChildrenStore, newChildrenStore) ||
		isSpecialImageElement(dimensions);

	if (shouldBeAnimated) {
		callback(dimensions, differences, parentDimensions);
	}

	//if the element appears or disappears, we dont need to calculate the children
	if (dimensions.some((entry) => !isEntryVisible(entry))) {
		return;
	}

	const newParentDimension = shouldBeAnimated ? dimensions : parentDimensions;

	oldChildrenStore.forEach((oldChild, key) => {
		if (newChildrenStore.has(key)) {
			diffDomTrees(oldChild, newChildrenStore.get(key)!, callback, newParentDimension);
			newChildrenStore.delete(key);
			return;
		}
		diffDomTrees(oldChild, saveTreeValue(oldChild), callback, newParentDimension);
	});

	newChildrenStore.forEach((newChild) => {
		diffDomTrees(saveTreeValue(newChild), newChild, callback, newParentDimension);
	});
};
