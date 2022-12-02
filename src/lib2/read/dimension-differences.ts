import {
	DimensionalDifferences,
	ElementReadouts,
	DifferenceArray,
	ElementEntry,
	WorkerState,
} from "../types";

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

export const getTranslates = (
	child: DifferenceArray,
	parent: DifferenceArray | [undefined, undefined]
) => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;

	//TODO: If the root is scrolled down, maybe these need to be corrected by the scroll position
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

	const currentLeftDifference =
		current.left + originCurrentLeft - (parentCurrentLeft + originParentCurrentLeft);
	const referenceLeftDifference =
		reference.left + originReferenceLeft - (parentReferenceLeft + originParentReferenceLeft);

	const currentTopDifference =
		current.top + originCurrentTop - (parentCurrentTop + originParentCurrentTop);
	const referenceTopDifference =
		reference.top + originReferenceTop - (parentReferenceTop + originParentReferenceTop);

	return {
		currentLeftDifference,
		referenceLeftDifference,
		currentTopDifference,
		referenceTopDifference,
	};
};

const getScales = (
	child: DifferenceArray,
	parent: DifferenceArray | [undefined, undefined],
	isTextNode: boolean
) => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;

	const parentCurrentWidth = parentCurrentEntry?.dimensions.width ?? 1;
	const parentCurrentHeight = parentCurrentEntry?.dimensions.height ?? 1;
	const parentReferenceWidth = parentReferenceEntry?.dimensions.width ?? 1;
	const parentReferenceHeight = parentReferenceEntry?.dimensions.height ?? 1;

	const parentWidthDifference = parentCurrentWidth / parentReferenceWidth;
	const parentHeightDifference = parentCurrentHeight / parentReferenceHeight;
	const childWidthDifference = current.width / reference.width;
	const childHeightDifference = current.height / reference.height;

	const heightDifference = (isTextNode ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference = (isTextNode ? 1 : childWidthDifference) / parentWidthDifference;

	const textCorrection = isTextNode
		? (parentCurrentWidth - parentReferenceWidth) / 2 / parentWidthDifference
		: 0;

	return {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textCorrection,
	};
};

//TODO: if the animation is executed and scrolled down, the values are wrong, it shifts down as well

export const calculateDimensionDifferences = (
	child: DifferenceArray,
	parent: DifferenceArray | [undefined, undefined],
	isTextNode: boolean
): DimensionalDifferences => {
	const [currentEntry] = child;

	const {
		currentLeftDifference,
		referenceLeftDifference,
		currentTopDifference,
		referenceTopDifference,
	} = getTranslates(child, parent);

	const {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textCorrection,
	} = getScales(child, parent, isTextNode);

	const leftDifference =
		currentLeftDifference / parentWidthDifference - referenceLeftDifference - textCorrection;
	const topDifference = currentTopDifference / parentHeightDifference - referenceTopDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: currentEntry.offset,
	};
};

export const getDomDifferences = (workerState: WorkerState) => {
	// we can get one element at the time, either default order or reversed
	// these entries are still unfiltered for display none
	// if it is not an image, we could get the difference
};
