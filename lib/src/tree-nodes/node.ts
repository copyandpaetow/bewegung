import { getOptionsFromElement } from "../element/animation-options";
import { Readout } from "../element/readout";
import { Context } from "../web-component";
import { NodeChanges } from "./loop";

export const fake = {} as TreeNode;

export type TreeNode = {
	element: HTMLElement;
	parent: TreeNode;
	next: TreeNode;
	subloopEnd: TreeNode;
	readout: Readout | null;
	pendingReadout: Readout | null;
	hasChanged: boolean;
	animation: Animation;
};

export const createNode = (
	element: HTMLElement,
	parent: TreeNode,
	context: Context,
	nodeChanges: NodeChanges
) => {
	const wasAvailable = nodeChanges.removedNodes.get(element);

	const node: TreeNode = wasAvailable ?? {
		element,
		readout: null,
		pendingReadout: null,
		parent,
		next: fake,
		subloopEnd: fake,
		animation: new Animation(
			new KeyframeEffect(
				element,
				null,
				getOptionsFromElement(element, context.animationOptions)
			)
		),
		hasChanged: false,
	};

	node.subloopEnd = node;
	node.parent = parent;
	node.hasChanged = false;
	node.readout = node.pendingReadout ?? node.readout;
	node.pendingReadout = null;

	if (!wasAvailable) {
		node.hasChanged = true;
		if (!nodeChanges.addedNodes.has(parent.element)) {
			nodeChanges.addedNodes.set(element, node);
		}
	} else {
		nodeChanges.removedNodes.delete(element);
	}
	context.treeNodes.set(element, node);

	return node;
};
