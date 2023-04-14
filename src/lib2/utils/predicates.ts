import { AllReadoutTypes } from "../types";

export const isEntryVisible = (entry: AllReadoutTypes) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const doesElementChangeInScale = (readouts: AllReadoutTypes[]) =>
	readouts.some(
		(entry) =>
			entry.unsaveWidth !== readouts.at(-1)!.unsaveWidth ||
			entry.unsaveHeight !== readouts.at(-1)!.unsaveHeight
	);

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;

export const checkForDisplayNone = <Value extends AllReadoutTypes>(entry: Value) =>
	entry.display === "none";
export const checkForBorderRadius = <Value extends AllReadoutTypes>(entry: Value) =>
	entry.borderRadius !== "0px";
