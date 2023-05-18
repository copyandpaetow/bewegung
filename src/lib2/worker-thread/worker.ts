import {
	AnimationFlag,
	DomTree,
	MainMessages,
	TimelineEntry,
	TreeStyle,
	WorkerMessages,
	WorkerState,
} from "../types";
import { useWorker } from "../utils/use-worker";
import { revertEasings, updateKeyframes } from "./calculate-animation-tree";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state: WorkerState = {
	readouts: new Map<string, TreeStyle[]>(),
	easings: new Map<string, TimelineEntry[]>(),
	keyframes: new Map<string, Keyframe[]>(),
	overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
	flags: new Map<string, AnimationFlag>(),
	isObserverRequired: false,
};

const updateReadouts = (tree: DomTree, state: WorkerState) => {
	const key = tree.key;

	state.readouts.set(key, (state.readouts.get(key) ?? []).concat(tree.style));
	if (!state.easings.has(key)) {
		state.easings.set(key, revertEasings(tree.easings));
	}

	tree.children.forEach((childTree) => updateReadouts(childTree, state));
};

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { domTrees, offset } = domChanges;

	domTrees.forEach((tree) => {
		updateReadouts(tree, state);
	});

	if (offset === 1) {
		domTrees.forEach((tree) => {
			updateKeyframes(tree, "", state);
		});

		workerAtom("sendAnimationTrees").reply("animationTrees", {
			keyframes: state.keyframes,
			overrides: state.overrides,
			flags: state.flags,
		});

		//TODO: we might need to clean up the state after that
	}
});
