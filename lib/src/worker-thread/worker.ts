import { MainMessages, ResultTree, TreeStyle, WorkerMessages, Result } from "../types";
import { useWorker } from "../utils/use-worker";
import { updateKeyframes } from "./calculate-animation-tree";
import { getEmptyNode, getOffset, mergeTrees, normalizeReadouts } from "./set-readouts";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);
const offsets: number[] = [];
const resultTrees = new Map<string, ResultTree>();

const getEmptyResult = (): Result => ({
	keyframes: new Map<string, Keyframe[]>(),
	overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
});

workerAtom("sendDOMRepresentation").onMessage((domTree) => {
	console.log(domTree);

	// const offset = getOffset(domTrees);
	// offsets.push(offset);
	// domTrees.forEach((tree) => {
	// 	const resultTree = resultTrees.get(tree.key) ?? getEmptyNode(tree.key);
	// 	resultTrees.set(tree.key, mergeTrees(tree, resultTree));
	// });
	// if (offset === 1) {
	// 	resultTrees.forEach((tree) => {
	// 		const result = getEmptyResult();
	// 		normalizeReadouts(tree, offsets, null);
	// 		updateKeyframes(tree, undefined, result);
	// 		workerAtom("sendAnimationData").reply("animationData", result);
	// 	});
	// }
});
