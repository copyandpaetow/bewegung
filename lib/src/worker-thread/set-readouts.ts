import { TreeStyle, DomTree, WorkerState } from "../types";
import { isEntryVisible } from "../utils/predicates";

const normalizeReadouts = (
	elementReadouts: Map<number, TreeStyle>,
	currentOffset: number,
	pastOffsets: number[]
) => {
	//if we are on the first readout, we cant normalize anything
	if (currentOffset === 0) {
		return;
	}

	const current = elementReadouts.get(currentOffset)!;

	//if we are on the last position and the element needs normalizing, we need the last safe entry as reference
	if (currentOffset === 1 && !isEntryVisible(current)) {
		[...pastOffsets].reverse().some((offset) => {
			const previousReadout = elementReadouts.get(offset);
			if (previousReadout && isEntryVisible(previousReadout)) {
				elementReadouts.set(offset, {
					...previousReadout,
					display: previousReadout.display === "none" ? current.display : previousReadout.display,
					unsaveHeight: 0,
					unsaveWidth: 0,
					offset,
				});
				return true;
			}

			return false;
		});
		return;
	}

	//if this is not a safe entry, we just return, fixing this later
	if (!isEntryVisible(current)) {
		return;
	}

	//if this is a safe entry, we walk back to see if some previous entry needs updating
	[...pastOffsets].reverse().some((offset) => {
		const previousReadout = elementReadouts.get(offset);
		if (previousReadout && isEntryVisible(previousReadout)) {
			return true;
		}
		//if it doesnt exist, it was added later
		if (!previousReadout) {
			elementReadouts.set(offset, {
				...current,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset,
			});
			return false;
		}
		//it it does, it has display hidden etc
		elementReadouts.set(offset, {
			...current,
			display: previousReadout.display === "none" ? current.display : previousReadout.display,
			unsaveHeight: 0,
			unsaveWidth: 0,
			offset,
		});

		return false;
	});
};

export const updateReadouts = (tree: DomTree, state: WorkerState) => {
	const key = tree.key;
	const elementReadouts = state.readouts.get(key) ?? new Map<number, TreeStyle>();
	const offset = tree.style.offset;

	elementReadouts.set(offset, tree.style);
	normalizeReadouts(elementReadouts, offset, state.pastOffsets);

	state.readouts.set(key, elementReadouts);

	tree.children.forEach((childTree) => updateReadouts(childTree, state));
};

export const getOffset = (domTrees: Map<string, DomTree>) =>
	domTrees.values().next().value.style.offset;
