import { DimensionalDifferences, DomTree, TreeStyle, WorkerState } from "../types";
import { doesElementChangeInScale, isElementUnchanged } from "../utils/predicates";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import { setDefaultKeyframes, setImageKeyframes } from "./get-keyframes";

const setAbsoluteOverrides = (tree: DomTree, state: WorkerState, parentKey: string) => {
	const parentReadouts = state.readouts.get(parentKey);
	const parentOverrides = state.overrides.get(parentKey) ?? {};
	const readouts = state.readouts.get(tree.key)!;
	const lastReadoout = readouts.get(1)!;
	const lastParentReadout = parentReadouts?.get(1);

	const absoluteStyle = {
		position: "absolute",
		display: "unset",
		left: lastReadoout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
		top: lastReadoout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
		width: lastReadoout.currentWidth + "px",
		height: lastReadoout.currentHeight + "px",
	};

	state.overrides.set(tree.key, { ...state.overrides.get(tree.key), ...absoluteStyle });
	if (lastParentReadout?.position === "static" && !parentOverrides?.position) {
		state.overrides.set(parentKey, {
			...parentOverrides,
			position: "relative",
		});
	}
};

const setEasings = (tree: DomTree, state: WorkerState) => {
	const easing = state.easings.get(tree.key)!;
	const parentEasing = state.easings.get(tree.parent?.key ?? "") ?? [];

	state.easings.set(tree.key, parentEasing.concat(easing));
};

const getDifferences = (
	readouts: Map<number, TreeStyle>,
	parentReadouts: Map<number, TreeStyle>
) => {
	const dimensions: DimensionalDifferences[] = [];
	const reference = readouts.get(1)!;
	const parentReference = parentReadouts.get(1)!;

	readouts.forEach((currentReadout, offset) =>
		dimensions.push(
			calculateDimensionDifferences({
				current: currentReadout,
				reference,
				parent: parentReadouts.get(offset)!,
				parentReference,
			})
		)
	);
	return dimensions;
};

const getRootDifferences = (readouts: Map<number, TreeStyle>, key: string) => {
	const dimensions: DimensionalDifferences[] = [];
	const reference = readouts.get(1)!;

	readouts.forEach((currentReadout) =>
		dimensions.push(
			calculateRootDifferences({
				current: currentReadout,
				reference,
				doesNeedBodyFix: false, //todo: this needs to be fixed again
			})
		)
	);
	return dimensions;
};

//todo: we still need something similar to the flag approach
const animationNotNeeded = (
	readouts: Map<number, TreeStyle>,
	differences: DimensionalDifferences[]
) => {
	if (readouts.size === 0 || differences.length === 0) {
		return true;
	}
	const isImage = Boolean(readouts.get(1)!.ratio);

	if (isImage && doesElementChangeInScale(Array.from(readouts.values()))) {
		return false;
	}

	return differences.every(isElementUnchanged);
};

/*
	in the case of a nested root element, if we stop there we lose the the parentNode
- we could store it in a map
- or ignore it, if nested but then we would need to  

=> if we stop reading the dom if we encounter a nested root, the updater function would stop anyways

*/

export const updateKeyframes = (
	tree: DomTree,
	state: WorkerState,
	parentKey: string | undefined
) => {
	//if we know early that this treeNode is not needed for the animation we could pass the parentReadouts down instead of the current ones

	const readouts = state.readouts.get(tree.key)!;
	const parentReadouts = parentKey ? state.readouts.get(parentKey) : null;

	const differences = !parentReadouts
		? getRootDifferences(readouts, tree.key)
		: getDifferences(readouts, parentReadouts);

	if (animationNotNeeded(readouts, differences)) {
		return tree.children.forEach((childTree) => updateKeyframes(childTree, state, parentKey));
	}

	const rootKey = parentKey ?? tree.key;
	state.lastReadout.set(rootKey, tree.key);

	setAbsoluteOverrides(tree, state, parentKey ?? ""); //if the parentKey is undefined, this would be an absolute positioned root element, which is still unhandled
	const isImage = Boolean(readouts.get(1)!.ratio);
	isImage
		? setImageKeyframes(tree, parentKey ?? "", state)
		: setDefaultKeyframes(differences, tree, state);

	tree.children.forEach((childTree) => updateKeyframes(childTree, state, tree.key));
};
