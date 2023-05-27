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
import { updateKeyframes } from "./calculate-animation-tree";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const state: WorkerState = {
	readouts: new Map<string, TreeStyle[]>(),
	easings: new Map<string, TimelineEntry[]>(),
	keyframes: new Map<string, Keyframe[]>(),
	overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
	flags: new Map<string, AnimationFlag>(),
};

const revertEasings = (easing: string): TimelineEntry[] => {
	if (!easing) {
		return [];
	}
	return JSON.parse(easing);
};

const updateReadouts = (tree: DomTree, state: WorkerState) => {
	const key = tree.key;

	state.readouts.set(key, (state.readouts.get(key) ?? []).concat(tree.style));
	if (!state.easings.has(key)) {
		state.easings.set(key, revertEasings(tree.easings));
	}

	tree.children.forEach((childTree) => updateReadouts(childTree, state));
};

const clearState = () => Object.values(state).forEach((map) => map.clear());

workerAtom("sendDOMRects").onMessage((domChanges) => {
	const { domTrees, offset } = domChanges;

	domTrees.forEach((tree) => {
		updateReadouts(tree, state);
	});

	if (offset === 1) {
		domTrees.forEach((tree) => {
			updateKeyframes(tree, state);
		});

		workerAtom("sendAnimationData").reply("animationData", {
			keyframes: state.keyframes,
			overrides: state.overrides,
			flags: state.flags,
		});

		clearState();
	}
});
