import { DimensionalDifferences, TreeElement, TreeRepresentation } from "../types";
import {
	hasObjectFit,
	isElementChanged,
	isEntryVisible,
	isNonReplacementInlineElement,
} from "../utils/predicates";
import { calculateDifferences } from "./keyframes";

const saveTreeValue = (tree: TreeRepresentation) => {
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

export const diffDomTrees = (
	oldDom: TreeRepresentation,
	newDom: TreeRepresentation,
	callback: (
		dimensions: [TreeElement, TreeElement],
		differences: DimensionalDifferences[],
		parentDimensions: [TreeElement, TreeElement] | undefined
	) => void,
	parentDimensions?: [TreeElement, TreeElement]
) => {
	const oldChildren = oldDom[1] as TreeRepresentation[];
	const newChildren = newDom[1] as TreeRepresentation[];
	const dimensions: [TreeElement, TreeElement] = [
		oldDom[0] as TreeElement,
		newDom[0] as TreeElement,
	];

	if (dimensions[0].key !== dimensions[1].key) {
		console.warn("trees are not aligned", dimensions);
		return;
	}

	//if both entries are hidden the element was hidden in general and doesnt need any animations as well as their children
	if (dimensions.every((entry) => !isEntryVisible(entry))) {
		return;
	}

	const differences = calculateDifferences(dimensions, parentDimensions);

	//if the element doesnt really change in the animation, we just skip it and continue with the children
	//we cant skip the whole tree because a decendent could still shrink
	//also inline elements cant be transformed (except replaceable elements such as img, video, canvas)

	//unchanged, objectFit there, not inline

	const isChangedElement =
		hasObjectFit(dimensions) ||
		(isElementChanged(differences) && !isNonReplacementInlineElement(dimensions));
	const newParentDimension = isChangedElement ? dimensions : parentDimensions;

	if (isChangedElement) {
		callback(dimensions, differences, parentDimensions);
	}

	if (oldChildren.length > newChildren.length) {
		for (let i = 0; i < oldChildren.length; i++) {
			const oldChild = oldChildren[i];
			const newChild =
				newChildren.find(
					(child) => (child[0] as TreeElement).key === (oldChild[0] as TreeElement).key
				) ?? saveTreeValue(oldChild);

			diffDomTrees(oldChild, newChild, callback, newParentDimension);
		}
		return;
	}

	for (let i = 0; i < newChildren.length; i++) {
		const newChild = newChildren[i];
		const oldChild =
			oldChildren.find(
				(child) => (child[0] as TreeElement).key === (newChild[0] as TreeElement).key
			) ?? saveTreeValue(newChild);

		diffDomTrees(oldChild, newChild, callback, newParentDimension);
	}
};
