import {
	AnimationFlag,
	DomTree,
	MainMessages,
	ParentTree,
	ResultingDomTree,
	WorkerMessages,
	WorkerState,
} from "../types";
import { useWorker } from "../utils/use-worker";
import {
	calculateIntermediateTree,
	generateAnimationTree,
	revertEasings,
} from "./calculate-animation-tree";
import { getEmptyReadouts } from "./get-keyframes";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state: WorkerState = {
	intermediateTree: new Map<string, DomTree>(),
};

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { domTrees, offset } = domChanges;

	domTrees.forEach((tree, key) => {
		if (!state.intermediateTree.has(key)) {
			state.intermediateTree.set(key, tree);
			return;
		}
		const previousTree = state.intermediateTree.get(key)!;

		state.intermediateTree.set(key, calculateIntermediateTree(previousTree, tree));
	});

	if (offset === 1) {
		const animationTrees = new Map<string, ResultingDomTree>();
		state.intermediateTree.forEach((domTree, key) => {
			const emptyParent: ParentTree = {
				style: getEmptyReadouts(domTree.style),
				overrides: {},
				flag: "default" as AnimationFlag,
				easings: revertEasings(domTree.easings),
				isRoot: true,
			};
			animationTrees.set(key, generateAnimationTree(domTree, emptyParent));
		});
		workerAtom("sendAnimationTrees").reply("animationTrees", animationTrees);
	}
});
