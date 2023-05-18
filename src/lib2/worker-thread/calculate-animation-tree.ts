import { DomTree, TimelineEntry, WorkerState } from "../types";
import { isEntryVisible, normalizeStyles, setKeyframes } from "./get-keyframes";

export const revertEasings = (easing: string): TimelineEntry[] => {
	if (!easing) {
		return [];
	}
	return JSON.parse(easing);
};

const setOverrides = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const parentFlag = state.flags.get(parentKey)!;
	const parentReadouts = state.readouts.get(parentKey)!;
	const parentOverrides = state.overrides.get(parentKey) ?? {};
	const readouts = state.readouts.get(tree.key)!;

	if (parentFlag !== "removal") {
		return;
	}

	const absoluteStyle = {
		position: "absolute",
		left: readouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px",
		top: readouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px",
		width: readouts.at(-1)!.currentWidth + "px",
		height: readouts.at(-1)!.currentHeight + "px",
	};

	state.overrides.set(tree.key, { ...state.overrides.get(tree.key), ...absoluteStyle });
	if (parentReadouts.at(-1)!.position === "static" && !parentOverrides?.position) {
		state.overrides.set(parentKey, {
			...parentOverrides,
			position: "relative",
		});
	}
};

const setAnimationFlag = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const readouts = state.readouts.get(tree.key)!;
	const parentFlag = state.flags.get(parentKey);

	if (parentFlag === "removal") {
		state.flags.set(tree.key, "removal");
		return;
	}

	if (readouts.every(isEntryVisible)) {
		return;
	}
	if (isEntryVisible(readouts.at(-1)!)) {
		state.flags.set(tree.key, "addition");
		return;
	}
	state.flags.set(tree.key, "removal");
	return;
};

const setEasings = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const easing = state.easings.get(tree.key)!;
	const parentEasing = state.easings.get(parentKey) ?? [];

	state.easings.set(tree.key, parentEasing.concat(easing));
};

export const updateKeyframes = (tree: DomTree, parentKey: string, state: WorkerState) => {
	normalizeStyles(tree, parentKey, state);
	setAnimationFlag(tree, parentKey, state);
	setEasings(tree, parentKey, state);
	setOverrides(tree, parentKey, state);
	setKeyframes(tree, parentKey, state);

	tree.children.forEach((childTree) => updateKeyframes(childTree, tree.key, state));
};
