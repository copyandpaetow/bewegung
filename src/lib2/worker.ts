import {
	calculateIntermediateTree,
	generateAnimationTree,
	updateTreeStructure,
} from "./calculate-animation-tree";
import { getEmptyReadouts } from "./get-keyframes";
import {
	AnimationType,
	IntermediateDomTree,
	MainMessages,
	ParentTree,
	ResultingDomTree,
	WorkerMessages,
	WorkerState,
} from "./types";
import { useWorker } from "./utils/use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state: WorkerState = {
	intermediateTree: new Map<string, IntermediateDomTree>(),
};

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { domTrees, offset } = domChanges;

	domTrees.forEach((tree, key) => {
		const currentTree = updateTreeStructure(tree, offset);

		if (!state.intermediateTree.has(key)) {
			state.intermediateTree.set(key, currentTree);
			return;
		}
		const previousTree = state.intermediateTree.get(key)!;

		state.intermediateTree.set(key, calculateIntermediateTree(previousTree, currentTree));
	});

	if (offset === 1) {
		const animationTrees = new Map<string, ResultingDomTree>();
		state.intermediateTree.forEach((domTree, key) => {
			const emptyParent: ParentTree = {
				style: getEmptyReadouts(domTree.style),
				overrides: {},
				root: [],
				type: "default" as AnimationType,
				easings: domTree.easings,
			};
			animationTrees.set(key, generateAnimationTree(domTree, emptyParent));
		});
		workerAtom("sendAnimationTrees").reply("animationTrees", animationTrees);
	}
});
