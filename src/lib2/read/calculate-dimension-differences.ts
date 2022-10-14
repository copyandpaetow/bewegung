import { DimensionalDifferences, ElementReadouts, DifferenceArray } from "../types";

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : value;
};

const parseTransformOrigin = (entry: ElementReadouts) => {
	const transformOriginString = entry.computedStyle.transformOrigin!;

	const calculated = transformOriginString.split(" ").map((value: string, index: number) => {
		if (value.includes("px")) {
			return parseFloat(value);
		}
		const heightOrWidth = index ? entry.dimensions.height : entry.dimensions.width;

		return (parseFloat(value) / 100) * heightOrWidth;
	});

	return calculated;
};

export const calculateDimensionDifferences = (
	child: DifferenceArray,
	parent: DifferenceArray,
	isTextNode: boolean
): DimensionalDifferences => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;
	const parentCurrent = parentCurrentEntry.dimensions;
	const parentReference = parentReferenceEntry.dimensions;

	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(referenceEntry);
	const [originParentReferenceLeft, originParentReferenceTop] =
		parseTransformOrigin(parentReferenceEntry);

	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(currentEntry);
	const [originParentCurrentLeft, originParentCurrentTop] =
		parseTransformOrigin(parentCurrentEntry);

	const parentWidthDifference = parentCurrent.width / parentReference.width;
	const parentHeightDifference = parentCurrent.height / parentReference.height;
	const childWidthDifference = current.width / reference.width;
	const childHeightDifference = current.height / reference.height;

	const heightDifference = (isTextNode ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference = (isTextNode ? 1 : childWidthDifference) / parentWidthDifference;

	const currentXDifference =
		current.left + originCurrentLeft - (parentCurrent.left + originParentCurrentLeft);
	const referenceXDifference =
		reference.left + originReferenceLeft - (parentReference.left + originParentReferenceLeft);

	const currentYDifference =
		current.top + originCurrentTop - (parentCurrent.top + originParentCurrentTop);
	const referenceYDifference =
		reference.top + originReferenceTop - (parentReference.top + originParentReferenceTop);

	const positionCorrection = isTextNode
		? (parentCurrent.width - parentReference.width) / 2 / parentWidthDifference
		: 0;

	const xDifference =
		currentXDifference / parentWidthDifference - referenceXDifference - positionCorrection;
	const yDifference = currentYDifference / parentHeightDifference - referenceYDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		xDifference: save(xDifference, 0),
		yDifference: save(yDifference, 0),
		offset: currentEntry.offset,
	};
};
