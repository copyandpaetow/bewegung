import { getKeyframes, isEntryVisible, normalizeStyles } from "./get-keyframes";
import {
	AnimationType,
	DomTree,
	IntermediateDomTree,
	Overrides,
	ParentTree,
	ResultingDomTree,
	TimelineEntry,
	TreeStyleWithOffset,
} from "./types";

const revertEasings = (easing: string): TimelineEntry[] => {
	if (!easing) {
		return [];
	}

	return easing.split("---").map((easings) => {
		const [startString, endString, easing] = easings.split("-");

		return { start: parseFloat(startString), end: parseFloat(endString), easing };
	});
};

//TODO: this is uneccessary work and should be removed
export const updateTreeStructure = (tree: DomTree, offset: number): IntermediateDomTree => {
	const intermediateTree: IntermediateDomTree = {
		root: tree.root,
		easings: revertEasings(tree.easings),
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

	return {
		root: accumulator.root,
		easings: accumulator.easings,
		style: accumulator.style.concat(style),
		key: accumulator.key,
		children: accumulatorChildren.map((child, index) =>
			calculateIntermediateTree(child, currentChildren[index])
		),
	};
};

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

const getAnimationType = (
	readouts: TreeStyleWithOffset[],
	parentType: AnimationType
): AnimationType => {
	if (parentType === "removal") {
		return "removal";
	}
	if (readouts.every(isEntryVisible)) {
		return "default";
	}
	if (isEntryVisible(readouts.at(-1)!)) {
		return "addition";
	}

	return "removal";
};

export const generateAnimationTree = (tree: IntermediateDomTree, parent: ParentTree) => {
	const combinedRoots = parent.root.concat(...tree.root.split(" ")).filter(Boolean);
	const normalizedStyles = normalizeStyles(tree.style, parent.style);

	const current: ParentTree = {
		style: normalizedStyles,
		overrides: addMutatedElementOverrides(normalizedStyles, parent),
		root: combinedRoots,
		type: getAnimationType(tree.style, parent.type),
		easings: parent.easings.concat(tree.easings),
	};

	const keyframes = getKeyframes(current, parent);

	const intermediateTree: ResultingDomTree = {
		overrides: current.overrides,
		keyframes,
		key: tree.key,
		children: tree.children.map((child) => generateAnimationTree(child, current)),
	};

	return intermediateTree;
};
