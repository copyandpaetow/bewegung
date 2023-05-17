import { getKeyframes, isEntryVisible, normalizeStyles } from "./get-keyframes";
import {
	AnimationFlag,
	DomTree,
	Overrides,
	ParentTree,
	ResultingDomTree,
	TimelineEntry,
	TreeStyle,
} from "../types";

export const revertEasings = (easing: string): TimelineEntry[] => {
	if (!easing) {
		return [];
	}
	return JSON.parse(easing);
};

/*
? how to keep the order right?
=> if the current is larger than the accumulator, elements where added. We dont know where or if some elements where removed as well
=> if the current is smaller than the accumulator, the opposite is true. We dont know where or if some elements where added as well 
=> if they are equal either no elements where changed or equally added and removed

we could check 

*/

export const combineKeys = (accumulator: DomTree[], current: DomTree[]) => {
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

export const calculateIntermediateTree = (accumulator: DomTree, current: DomTree): DomTree => {
	const children = current.children ?? [];
	const style = current.style ?? [];
	const allKeys = combineKeys(accumulator.children, children);

	const accumulatorChildren = allKeys.map(
		(key) =>
			accumulator.children.find((entry) => entry.key === key) ??
			children.find((entry) => entry.key === key)!
	);

	const currentChildren = allKeys.map(
		(key) => (children.find((entry) => entry.key === key) ?? []) as DomTree
	);

	return {
		easings: accumulator.easings,
		style: accumulator.style.concat(style),
		key: accumulator.key,
		children: accumulatorChildren.map((child, index) =>
			calculateIntermediateTree(child, currentChildren[index])
		),
	};
};

const addMutatedElementOverrides = (readouts: TreeStyle[], parentEntry: ParentTree): Overrides => {
	const { style: parentReadouts, overrides: parentOverrides } = parentEntry;
	const overrides: Overrides = {};

	//TODO: other styles like border radius

	if (parentEntry.flag !== "removal") {
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

const getAnimationFlag = (readouts: TreeStyle[], parentType: AnimationFlag): AnimationFlag => {
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

//TODO: this needs to be normalized => we are checking at several places to not continue
export const generateAnimationTree = (tree: DomTree, parent: ParentTree) => {
	const normalizedStyles = normalizeStyles(tree.style, parent.style);

	if (!normalizedStyles.length) {
		return {
			overrides: {},
			keyframes: [],
			key: tree.key,
			children: [],
		};
	}

	const current: ParentTree = {
		style: normalizedStyles,
		overrides: addMutatedElementOverrides(normalizedStyles, parent),
		flag: getAnimationFlag(tree.style, parent.flag),
		easings: parent.easings.concat(revertEasings(tree.easings)),
		isRoot: false,
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
