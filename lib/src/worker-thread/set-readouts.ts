import { TreeEntry } from "../types";

export const isCurrentEntryVisible = (entry: TreeEntry) =>
	entry.display !== "none" &&
	entry.display !== "" &&
	entry.currentHeight !== 0 &&
	entry.currentWidth !== 0;

export const normalizeReadouts = (readouts: TreeEntry[], allOffsets: number[]) => {
	let lastSaveReadout = readouts.find(isCurrentEntryVisible) ?? readouts.at(-1)!;

	return allOffsets.map((offset) => {
		const current = readouts.find((entry) => entry.offset === offset);

		//best case -  the readout is there and the element is visible
		if (current && isCurrentEntryVisible(current)) {
			lastSaveReadout = current;
			return { ...current, unsaveHeight: current.currentHeight, unsaveWidth: current.currentWidth };
		}
		//the readout is there but the element was hidden e.g. with display:none
		//we need to update its values for it to be save to use
		if (current) {
			return { ...current, unsaveHeight: current.currentHeight, unsaveWidth: current.currentWidth };
		}

		//if the current offset is not included in the partial offsets, it was not read at that time
		//we just need to add the same readout with an updated offset

		return {
			...lastSaveReadout,
			unsaveHeight: lastSaveReadout.currentHeight,
			unsaveWidth: lastSaveReadout.currentWidth,
			offset,
		};
	});
};
