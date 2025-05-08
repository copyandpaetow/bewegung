import { TreeNode } from "./node";

export const setAnimation = (node: TreeNode, keyframes: Keyframe[]) => {
	(node.animation.effect as KeyframeEffect).setKeyframes(keyframes);
	queueMicrotask(() => {
		node.animation.play();
		//node.animation.pause();
	});
};
