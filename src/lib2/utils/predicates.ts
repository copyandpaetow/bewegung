import { TreeStyleWithOffset } from "../types";

export const isEntryVisible = (entry: TreeStyleWithOffset) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const doesElementChangeInScale = (readouts: TreeStyleWithOffset[]) =>
	readouts.some(
		(entry) =>
			entry.unsaveWidth !== readouts.at(-1)!.unsaveWidth ||
			entry.unsaveHeight !== readouts.at(-1)!.unsaveHeight
	);

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const checkForDisplayNone = (entry: TreeStyleWithOffset) => entry.display === "none";
export const checkForBorderRadius = (entry: TreeStyleWithOffset) => entry.borderRadius !== "0px";
