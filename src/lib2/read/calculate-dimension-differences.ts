import { DimensionalDifferences, ElementReadouts, DifferenceArray } from "../types";

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : value;
};

const parseTransformOrigin = (entry: ElementReadouts | undefined) => {
	if (!entry) {
		return [0, 0];
	}

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
	parent: DifferenceArray | [undefined, undefined],
	isTextNode: boolean
): DimensionalDifferences => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;

	const parentCurrentWidth = parentCurrentEntry?.dimensions.width ?? 1;
	const parentCurrentHeight = parentCurrentEntry?.dimensions.height ?? 1;
	const parentReferenceWidth = parentReferenceEntry?.dimensions.width ?? 1;
	const parentReferenceHeight = parentReferenceEntry?.dimensions.height ?? 1;

	const parentCurrentLeft = parentCurrentEntry?.dimensions.left ?? 0;
	const parentCurrentTop = parentCurrentEntry?.dimensions.top ?? 0;
	const parentReferenceLeft = parentReferenceEntry?.dimensions.left ?? 0;
	const parentReferenceTop = parentReferenceEntry?.dimensions.top ?? 0;

	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(referenceEntry);
	const [originParentReferenceLeft, originParentReferenceTop] =
		parseTransformOrigin(parentReferenceEntry);

	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(currentEntry);
	const [originParentCurrentLeft, originParentCurrentTop] =
		parseTransformOrigin(parentCurrentEntry);

	const parentWidthDifference = parentCurrentWidth / parentReferenceWidth;
	const parentHeightDifference = parentCurrentHeight / parentReferenceHeight;
	const childWidthDifference = current.width / reference.width;
	const childHeightDifference = current.height / reference.height;

	const heightDifference = (isTextNode ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference = (isTextNode ? 1 : childWidthDifference) / parentWidthDifference;

	const currentLeftDifference =
		current.left + originCurrentLeft - (parentCurrentLeft + originParentCurrentLeft);
	const referenceXDifference =
		reference.left + originReferenceLeft - (parentReferenceLeft + originParentReferenceLeft);

	const currentTopDifference =
		current.top + originCurrentTop - (parentCurrentTop + originParentCurrentTop);
	const referenceYDifference =
		reference.top + originReferenceTop - (parentReferenceTop + originParentReferenceTop);

	const positionCorrection = isTextNode
		? (parentCurrentWidth - parentReferenceWidth) / 2 / parentWidthDifference
		: 0;

	const leftDifference =
		currentLeftDifference / parentWidthDifference - referenceXDifference - positionCorrection;
	const topDifference = currentTopDifference / parentHeightDifference - referenceYDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: currentEntry.offset,
	};
};
