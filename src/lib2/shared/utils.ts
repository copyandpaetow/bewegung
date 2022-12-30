import { ElementReadouts } from "../types";

export const highestNumber = (numbers: number[]) =>
	numbers.reduce((largest, current) => Math.max(largest, current));

export const checkForBorderRadius = (entry: ElementReadouts) => entry.borderRadius !== "0px";

export const checkForDisplayInline = (entry: ElementReadouts) => entry.display === "inline";

export const checkForDisplayNone = (entry: ElementReadouts) => entry.display === "none";

export const isEntryVisible = (entry: ElementReadouts) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveWidth !== 0;

export const checkForPositionStatic = (entry: ElementReadouts) => entry.position === "static";

export const compareOffsetObjects = <Value>(
	a: Record<string, Value>,
	b: Record<string, Value>
): boolean =>
	Object.entries(a).every(([key, value]) => {
		if (key === "offset") {
			return true;
		}

		return b[key] === value;
	});
