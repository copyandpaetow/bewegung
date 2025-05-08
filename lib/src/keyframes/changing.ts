import { TreeNode } from "../tree-nodes/node";
import { getDifferences } from "./diff";

export const calculateKeyframes = (node: TreeNode): Keyframe[] => {
	const delta = getDifferences(
		node.pendingReadout!,
		node.readout!,
		node.parent?.pendingReadout!,
		node.parent?.readout!
	);

	const flipMatrix = new DOMMatrix();
	flipMatrix.translateSelf(delta.leftDifference, delta.topDifference);
	flipMatrix.scaleSelf(delta.widthDifference, delta.heightDifference);

	const currentMatrix = node.readout!.transform;

	const combinedMatrix = currentMatrix.multiply(flipMatrix);

	return [
		{ transform: combinedMatrix.toString() },
		{ transform: currentMatrix.toString() },
	];
};
