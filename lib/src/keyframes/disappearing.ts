import { TreeNode } from "../tree-nodes/node";
import { getDifferences } from "./diff";

export const getDisappearingKeyframes = (node: TreeNode): Keyframe[] => {
	const delta = getDifferences(
		node.readout!,
		node.readout!,
		node.parent?.pendingReadout!,
		node.parent?.readout!
	);

	const from = new DOMMatrix(node.readout!.transform.toString());

	from.scaleSelf(
		1 / delta.parentWidthDifference,
		1 / delta.parentHeightDifference
	);

	const to = new DOMMatrix(from.toString());
	to.scaleSelf(0.001, 0.001);

	return [{ transform: from.toString() }, { transform: to.toString() }];
};
