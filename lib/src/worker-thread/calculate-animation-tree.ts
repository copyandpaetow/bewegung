import { DimensionalDifferences, Result, ResultTree, TreeStyle } from "../types";
import { doesElementChangeInScale, isElementUnchanged } from "../utils/predicates";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import { calculateImageDifferences } from "./calculate-image-differences";
import { getImageData, setDefaultKeyframes, setImageRelatedKeyframes } from "./get-keyframes";

const setAbsoluteOverrides = (
	tree: ResultTree,
	parent: ResultTree | undefined,
	overrides: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const parentReadouts = parent?.readouts;
	const readouts = tree.readouts;
	const lastReadoout = readouts.at(1)!;
	const lastParentReadout = parentReadouts?.at(1);

	const currentOverride = overrides.get(tree.key) ?? {};

	currentOverride.position = "absolute";
	currentOverride.display = "unset";
	currentOverride.left = lastReadoout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px";
	currentOverride.top = lastReadoout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px";
	currentOverride.width = lastReadoout.currentWidth + "px";
	currentOverride.height = lastReadoout.currentHeight + "px";

	overrides.set(tree.key, currentOverride);

	if (!parent) {
		return;
	}

	const parentOverride = overrides.get(parent.key) ?? {};

	if (lastParentReadout?.position !== "static" || parentOverride.position) {
		return;
	}
	parentOverride.position = "relative";
};

const getDifferences = (readouts: TreeStyle[], parentReadouts: TreeStyle[]) => {
	const reference = readouts.at(1)!;
	const parentReference = parentReadouts.at(1)!;

	return readouts.map((currentReadout, index) =>
		calculateDimensionDifferences({
			current: currentReadout,
			reference,
			parent: parentReadouts.at(index)!,
			parentReference,
		})
	);
};

const getRootDifferences = (readouts: TreeStyle[]) => {
	const reference = readouts.at(1)!;

	return readouts.map((currentReadout) =>
		calculateRootDifferences({
			current: currentReadout,
			reference,
		})
	);
};

const areObjectsEqual = <Type extends Record<string, any>>(a: Type, b: Type) =>
	Object.entries(a).every(([key, value]) => b[key] === value);

const areDifferencesEqual = (a: DimensionalDifferences[], b: DimensionalDifferences[]) =>
	a.every((entry, index) => areObjectsEqual(entry, b[index]));

const animationNotNeeded = (tree: ResultTree, parent: ResultTree | undefined, isImage: boolean) => {
	if (parent && !isImage && areDifferencesEqual(tree.differences, parent.differences)) {
		return true;
	}

	return tree.differences.every(isElementUnchanged);
};

export const updateKeyframes = (
	tree: ResultTree,
	parent: ResultTree | undefined,
	result: Result
) => {
	const isImage = Boolean(tree.readouts.at(1)!.ratio) && doesElementChangeInScale(tree.readouts);

	if (isImage) {
		tree.differences = calculateImageDifferences(tree.readouts);
	} else {
		tree.differences = !parent
			? getRootDifferences(tree.readouts)
			: getDifferences(tree.readouts, parent.readouts);
	}

	if (animationNotNeeded(tree, parent, isImage)) {
		return tree.children.forEach((childTree) => updateKeyframes(childTree, parent, result));
	}

	//todo: real condition for when elements are deleted or display none towards the end
	if (false) {
		setAbsoluteOverrides(tree, parent, result.overrides); //if the parentKey is undefined, this would be an absolute positioned root element, which is still unhandled
	}
	result.keyframes.set(tree.key, setDefaultKeyframes(tree, result.overrides));

	if (isImage) {
		setImageRelatedKeyframes(tree, parent, result);
	}

	tree.children.forEach((childTree) => updateKeyframes(childTree, tree, result));
};
