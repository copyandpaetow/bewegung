import { DomTree, TreeStyle, WorkerState } from "../types";
import { isEntryVisible } from "../utils/predicates";
import { setKeyframes } from "./get-keyframes";

const normalizeStyles = (tree: DomTree, state: WorkerState) => {
	const updatedReadouts: TreeStyle[] = [];
	const readouts = state.readouts.get(tree.key)!;
	const parentReadouts = state.readouts.get(tree.parent?.key ?? "") ?? readouts;

	parentReadouts
		.map((parentReadout) => parentReadout.offset)
		.forEach((offset) => {
			const nextIndex = readouts.findIndex((entry) => entry.offset === offset);
			const correspondingReadout = readouts[nextIndex];

			if (correspondingReadout && isEntryVisible(correspondingReadout)) {
				updatedReadouts.push(correspondingReadout);
				return;
			}

			const nextVisibleReadout =
				readouts.slice(nextIndex).find(isEntryVisible) || updatedReadouts.at(-1);

			if (!nextVisibleReadout) {
				//If there is no visible next element and not a previous one, the element is always hidden and can be deleted
				return;
			}

			updatedReadouts.push({
				...nextVisibleReadout,
				display: correspondingReadout ? correspondingReadout.display : nextVisibleReadout.display,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset,
			});

			return;
		});
	state.readouts.set(tree.key, updatedReadouts);
};

const setAbsoluteOverrides = (tree: DomTree, state: WorkerState) => {
	const parentKey = tree.parent?.key ?? "";
	const parentFlag = state.flags.get(parentKey);
	const parentReadouts = state.readouts.get(parentKey);
	const parentOverrides = state.overrides.get(parentKey) ?? {};
	const flag = state.flags.get(tree.key);
	const readouts = state.readouts.get(tree.key)!;

	if (parentFlag === "removal" || flag !== "removal") {
		//if the parent is getting removed, we dont need to do any position the element absolutly because the parent already is
		//if the element is not getting removed, we also dont need this absolute styling
		return;
	}

	const absoluteStyle = {
		position: "absolute",
		display: "unset",
		left: readouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px",
		top: readouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px",
		width: readouts.at(-1)!.currentWidth + "px",
		height: readouts.at(-1)!.currentHeight + "px",
	};

	state.overrides.set(tree.key, { ...state.overrides.get(tree.key), ...absoluteStyle });
	if (parentReadouts?.at(-1)!.position === "static" && !parentOverrides?.position) {
		state.overrides.set(parentKey, {
			...parentOverrides,
			position: "relative",
		});
	}
};

const setAnimationFlag = (tree: DomTree, state: WorkerState) => {
	const readouts = state.readouts.get(tree.key)!;
	const parentFlag = state.flags.get(tree.parent?.key ?? tree.key);

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

const setEasings = (tree: DomTree, state: WorkerState) => {
	const easing = state.easings.get(tree.key)!;
	const parentEasing = state.easings.get(tree.parent?.key ?? "") ?? [];

	state.easings.set(tree.key, parentEasing.concat(easing));
};

export const updateKeyframes = (tree: DomTree, state: WorkerState) => {
	normalizeStyles(tree, state);
	setAnimationFlag(tree, state);
	setEasings(tree, state);
	setAbsoluteOverrides(tree, state);
	setKeyframes(tree, state);

	tree.children.forEach((childTree) => updateKeyframes(childTree, state));
};
