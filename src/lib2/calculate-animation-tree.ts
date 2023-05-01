import { getKeyframes, normalizeStyles } from "./get-keyframes";
import {
	DomTree,
	IntermediateDomTree,
	NormalizedProps,
	ResultingDomTree,
	TreeStyleWithOffset,
} from "./types";

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

export const alignTreeChildren = (
	accumulator: IntermediateDomTree[],
	current: IntermediateDomTree[]
) => {
	let lastMatchingIndex = -1;

	current.forEach((currentChild, currentIndex) => {
		//if the current key is available in the accumulator, we update the styling and remember the index
		const hasAMatch = accumulator.some((accumulatorChild, accumulatorIndex) => {
			if (currentChild.key !== accumulatorChild.key) {
				return false;
			}

			accumulatorChild.style.push(currentChild.style[0]);
			lastMatchingIndex = accumulatorIndex;
			return true;
		});

		if (hasAMatch) {
			return;
		}

		//if the key is unknown and there is no last matching index,the element was added in the beginning
		if (lastMatchingIndex === -1) {
			accumulator.splice(currentIndex, 0, currentChild);
			return;
		}

		//if the key is unknown and there is a last matching index,the element was added later
		//by updating the lastMatchingIndex we do 2 things
		// 1) add the element after the match
		// 2) make sure we add a second added element after the first one
		lastMatchingIndex += 1;
		accumulator.splice(lastMatchingIndex, 0, currentChild);
	});
};

export const calculateIntermediateTree = (
	accumulator: IntermediateDomTree,
	current: IntermediateDomTree
): IntermediateDomTree => {
	//compare both childrenArrays and align

	const accumulatorChildren = accumulator.children;
	const currentChildren = current.children;

	alignTreeChildren(accumulatorChildren, currentChildren);

	const accumulatorTree: IntermediateDomTree = {
		root: accumulator.root,
		style: accumulator.style,
		key: accumulator.key,
		children: accumulator.children.map((child, index) =>
			calculateIntermediateTree(child, currentChildren[index])
		),
	};

	return accumulatorTree;
};

//the root calculation needs a special treatment
//images and text need also different functions

export const generateAnimationTree = (
	tree: IntermediateDomTree,
	parentDimensions: TreeStyleWithOffset[],
	parentRoot: string[],
	options: Map<string, NormalizedProps>
) => {
	const combinedRoots = parentRoot.concat(...tree.root.split(" ")).filter(Boolean);
	const rootOptions = combinedRoots.map((root) => options.get(root)!);
	const normalizedStyles = normalizeStyles(tree.style, parentDimensions);

	const { keyframes, overrides } = getKeyframes(normalizedStyles, parentDimensions, rootOptions);

	const intermediateTree: ResultingDomTree = {
		overrides,
		keyframes,
		key: tree.key,
		children: tree.children.map((child) =>
			generateAnimationTree(child, normalizedStyles, combinedRoots, options)
		),
	};

	return intermediateTree;
};
