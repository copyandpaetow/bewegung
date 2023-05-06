import { getKeyframes, isEntryVisible, normalizeStyles } from "./get-keyframes";
import {
	AnimationType,
	DomTree,
	IntermediateDomTree,
	NormalizedProps,
	Overrides,
	ParentTree,
	ResultingDomTree,
	TreeStyleWithOffset,
} from "./types";

//TODO: this is uneccessary work and should be removed
export const updateTreeStructure = (tree: DomTree, offset: number): IntermediateDomTree => {
	const intermediateTree: IntermediateDomTree = {
		root: tree.root,
		style: [
			{
				...tree.style,
				offset,
				currentHeight: tree.style.unsaveHeight,
				currentWidth: tree.style.unsaveWidth,
			},
		],
		key: tree.key,
		children: tree.children.map((child) => updateTreeStructure(child, offset)),
	};

	return intermediateTree;
};

/*
? how to keep the order right?
=> if the current is larger than the accumulator, elements where added. We dont know where or if some elements where removed as well
=> if the current is smaller than the accumulator, the opposite is true. We dont know where or if some elements where added as well 
=> if they are equal either no elements where changed or equally added and removed

we could check 

*/

export const combineKeys = (accumulator: IntermediateDomTree[], current: IntermediateDomTree[]) => {
	const accumulatorKeys = accumulator.map((entry) => entry.key);
	let lastMatchingIndex = -1;

	current.forEach((entry, index) => {
		const keyIndex = accumulatorKeys.findIndex((key) => key === entry.key);

		if (keyIndex !== -1) {
			lastMatchingIndex = keyIndex;
			return;
		}

		if (lastMatchingIndex === -1) {
			accumulatorKeys.splice(index, 0, entry.key);
			return;
		}

		lastMatchingIndex++;
		accumulatorKeys.splice(lastMatchingIndex, 0, entry.key);
	});

	return accumulatorKeys;
};

export const calculateIntermediateTree = (
	accumulator: IntermediateDomTree,
	current: IntermediateDomTree
): IntermediateDomTree => {
	const children = current.children ?? [];
	const style = current.style ?? [];
	const allKeys = combineKeys(accumulator.children, children);

	const accumulatorChildren = allKeys.map(
		(key) =>
			accumulator.children.find((entry) => entry.key === key) ??
			children.find((entry) => entry.key === key)!
	);

	const currentChildren = allKeys.map(
		(key) => (children.find((entry) => entry.key === key) ?? []) as IntermediateDomTree
	);

	if (accumulator.key.includes("UL-3")) {
		console.log({ accumulatorChildren, currentChildren, allKeys });
	}

	return {
		root: accumulator.root,
		style: accumulator.style.concat(style),
		key: accumulator.key,
		children: accumulatorChildren.map((child, index) =>
			calculateIntermediateTree(child, currentChildren[index])
		),
	};
};

//the root calculation needs a special treatment
//images and text need also different functions

const hasEntrySize = (entry: TreeStyleWithOffset) =>
	entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

const addMutatedElementOverrides = (
	readouts: TreeStyleWithOffset[],
	parentEntry: ParentTree
): Overrides => {
	const { style: parentReadouts, overrides: parentOverrides } = parentEntry;
	const overrides: Overrides = {};

	//TODO: other styles like border radius

	if (parentEntry.type !== "removal") {
		return overrides;
	}

	overrides.styles = {
		position: "absolute",
		left: readouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px",
		top: readouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px",
		width: readouts.at(-1)!.currentWidth + "px",
		height: readouts.at(-1)!.currentHeight + "px",
	};

	if (parentReadouts.at(-1)!.position === "static" && !parentOverrides.styles?.position) {
		parentOverrides.styles ??= {};
		parentOverrides.styles.position = "relative";
	}
	return overrides;
};

const getAnimationType = (readouts: TreeStyleWithOffset[]): AnimationType => {
	if (readouts.every(isEntryVisible)) {
		return "default";
	}
	if (isEntryVisible(readouts.at(-1)!)) {
		return "addition";
	}

	return "removal";
};

export const generateAnimationTree = (
	tree: IntermediateDomTree,
	parent: ParentTree,
	options: Map<string, NormalizedProps>
) => {
	const combinedRoots = parent.root.concat(...tree.root.split(" ")).filter(Boolean);
	const animationType = getAnimationType(tree.style);
	const rootOptions = combinedRoots.map((root) => options.get(root)!);
	const normalizedStyles = normalizeStyles(tree.style, parent.style);
	const overrides = addMutatedElementOverrides(normalizedStyles, parent);

	const keyframes = getKeyframes(normalizedStyles, parent, rootOptions);

	const parentEntry = {
		style: normalizedStyles,
		overrides,
		root: combinedRoots,
		type: parent.type === "removal" ? parent.type : animationType,
	};

	const intermediateTree: ResultingDomTree = {
		overrides,
		keyframes,
		key: tree.key,
		children: tree.children.map((child) => generateAnimationTree(child, parentEntry, options)),
	};

	if (tree.key.includes("UL-3")) {
		console.log(intermediateTree);
	}

	return intermediateTree;
};
