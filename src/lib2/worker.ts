import {
	calculateIntermediateTree,
	generateAnimationTree,
	updateTreeStructure,
} from "./calculate-animation-tree";
import { getEmptyReadouts } from "./get-keyframes";
import {
	IntermediateDomTree,
	MainMessages,
	NormalizedProps,
	ResultingDomTree,
	WorkerMessages,
	WorkerState,
} from "./types";
import { useWorker } from "./utils/use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state: WorkerState = {
	options: new Map<string, NormalizedProps>(),
	intermediateTree: new Map<string, IntermediateDomTree>(),
};

workerAtom("sendState").onMessage((stateTransferable) => {
	state.options = stateTransferable;
});

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
			const emptyParent = {
				style: getEmptyReadouts(domTree.style),
				overrides: {},
				root: [],
				hiddenAtSomePoint: false,
			};
			animationTrees.set(key, generateAnimationTree(domTree, emptyParent, state.options));
		});
		workerAtom("sendAnimationTrees").reply("animationTrees", animationTrees);
	}
});
