import { TreeNode } from "./node";

//TODO: we might not need the microtask approach anymore, we can walk the loop and play every changed nodes animation
export const setAnimation = (node: TreeNode, keyframes: Keyframe[]) => {
	(node.animation.effect as KeyframeEffect).setKeyframes(keyframes);
	queueMicrotask(() => {
		node.animation.play();
		//node.animation.pause();
	});
};
