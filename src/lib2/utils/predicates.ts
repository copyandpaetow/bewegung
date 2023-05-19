import { TreeStyle } from "../types";

export const isEntryVisible = (entry: TreeStyle) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const doesElementChangeInScale = (readouts: TreeStyle[]) =>
	readouts.some(
		(entry) =>
			entry.unsaveWidth !== readouts.at(-1)!.unsaveWidth ||
			entry.unsaveHeight !== readouts.at(-1)!.unsaveHeight
	);

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const checkForDisplayNone = (entry: TreeStyle) => entry.display === "none";
export const checkForBorderRadius = (entry: TreeStyle) => entry.borderRadius !== "0px";
