import { DomTree, ResultTree, TreeStyle } from "../types";
import { isEntryVisible } from "../utils/predicates";

const combineReadouts = (base: TreeStyle, current: TreeStyle, offset: number) => {
	return {
		...base,
		display: base.display === "none" ? current.display : base.display,
		unsaveHeight: 0,
		unsaveWidth: 0,
		offset,
	};
};

export const getEmptyNode = (key: string): ResultTree => ({
	key,
	readouts: [],
	differences: [],
	children: [],
});

export const mergeTrees = (tree: DomTree, resultTree: ResultTree) => {
	resultTree.readouts.push(tree.style);

	tree.children.forEach((treeChild) => {
		const match = resultTree.children.find((resultChild) => resultChild.key === treeChild.key);
		if (match) {
			return mergeTrees(treeChild, match);
		}
		const node = getEmptyNode(treeChild.key);
		resultTree.children.push(node);
		return mergeTrees(treeChild, node);
	});

	return resultTree;
};

export const getOffset = (domTrees: Map<string, DomTree>) =>
	domTrees.values().next().value.style.offset;

export const normalizeReadouts = (
	tree: ResultTree,
	allOffsets: number[],
	participatedOffsets: number[] | null
) => {
	const partialOffsets = participatedOffsets ?? tree.readouts.map((entry) => entry.offset);

	let lastSaveReadout = tree.readouts.find(isEntryVisible)!;

	tree.readouts = allOffsets.map((offset) => {
		const current = tree.readouts.find((entry) => entry.offset === offset);

		//best case -  the readout is there and the element is visible
		if (current && isEntryVisible(current)) {
			lastSaveReadout = current;
			return current;
		}
		//the readout is there but the element was hidden e.g. with display:none
		//we need to update its values for it to be save to use
		if (current) {
			return combineReadouts(current, lastSaveReadout, offset);
		}

		//if the current offset is not included in the partial offsets, it was not read at that time
		//we just need to add the same readout with an updated offset
		if (!partialOffsets.includes(offset)) {
			return { ...lastSaveReadout, offset };
		}

		//if we arrive here, the element was not in the dom at that time
		//so we create a version with update unsave values
		return combineReadouts(lastSaveReadout, lastSaveReadout, offset);
	});

	tree.children.forEach((childTree, index) => {
		if (
			childTree.readouts.length === 0 ||
			childTree.readouts.every((entry) => !isEntryVisible(entry))
		) {
			tree.children.splice(index, 1);
			return;
		}

		normalizeReadouts(childTree, allOffsets, partialOffsets);
	});
};
