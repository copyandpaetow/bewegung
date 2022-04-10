import { CalculatedProperties } from "../core/main-read-dimensions";
import { save } from "../utils/number-helpers";

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
}

type Entry = Omit<CalculatedProperties, "offset">;

export const calculateDimensionDifferences = (
	child: [Entry, Entry],
	parent: [Entry, Entry]
): DimensionalDifferences => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;
	const parentCurrent = parentCurrentEntry.dimensions;
	const parentReference = parentReferenceEntry.dimensions;

	const [originReferenceX, originReferenceY] =
		referenceEntry.styles.transformOrigin;
	const [originParentReferenceX, originParentReferenceY] =
		parentReferenceEntry.styles.transformOrigin;

	const [originCurrentX, originCurrentY] = currentEntry.styles.transformOrigin;
	const [originParentCurrentX, originParentCurrentY] =
		parentCurrentEntry.styles.transformOrigin;

	const childHeightDifference = current.height / reference.height;
	const childWidthDifference = current.width / reference.width;
	const parentHeightDifference = parentCurrent.height / parentReference.height;
	const parentWidthDifference = parentCurrent.width / parentReference.width;

	const heightDifference = childHeightDifference / parentHeightDifference;
	const widthDifference = childWidthDifference / parentWidthDifference;

	const currentXDifference =
		current.x + originCurrentX - parentCurrent.x + originParentCurrentX;
	const referenceXDifference =
		reference.x + originReferenceX - parentReference.x + originParentReferenceX;

	const currentYDifference =
		current.y + originCurrentY - parentCurrent.y + originParentCurrentY;
	const referenceYDifference =
		reference.y + originReferenceY - parentReference.y + originParentReferenceY;

	const xDifference =
		(currentXDifference - referenceXDifference * parentWidthDifference) /
		parentWidthDifference;
	const yDifference =
		(currentYDifference - referenceYDifference * parentHeightDifference) /
		parentHeightDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		xDifference: save(xDifference, 0),
		yDifference: save(yDifference, 0),
	};
};
