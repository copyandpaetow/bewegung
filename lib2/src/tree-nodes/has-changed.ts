import { updateReadout } from "../element/readout";
import { calculateKeyframes } from "../keyframes/changing";
import { setAnimation } from "./animation";
import { TreeNode } from "./node";

export const hasChanged = (node: TreeNode): Boolean => {
	if (node.hasChanged || node.element === this) {
		return false;
	}

	node.pendingReadout ??= updateReadout(node);
	node.parent.pendingReadout ??= updateReadout(node.parent);

	const keyframes = calculateKeyframes(node);

	if (keyframes.at(0)?.transform !== keyframes.at(-1)?.transform) {
		setAnimation(node, keyframes);

		return true;
	}

	if (
		node.parent.readout?.dimensions[2] !==
			node.parent.pendingReadout?.dimensions[2] ||
		node.parent.readout?.dimensions[3] !==
			node.parent.pendingReadout?.dimensions[3]
	) {
		return true;
	}

	return false;
};
