import { DifferenceArray, DimensionalDifferences, ElementReadouts } from "../types";

export const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value) ? alternative : value;
};

const parseTransformOrigin = (entry: ElementReadouts | undefined) => {
	if (!entry) {
		return [0, 0];
	}

	const transformOriginString = entry.transformOrigin!;

	const calculated = transformOriginString.split(" ").map((value: string, index: number) => {
		if (value.includes("px")) {
			return parseFloat(value);
		}
		const heightOrWidth = index ? entry.currentHeight : entry.currentWidth;

		return (parseFloat(value) / 100) * heightOrWidth;
	});

	return calculated;
};

export const getTranslates = (
	child: DifferenceArray,
	parent: DifferenceArray | [undefined, undefined]
) => {
	const [current, reference] = child;
	const [parentCurrent, parentReference] = parent;

	const parentCurrentLeft = parentCurrent?.currentLeft ?? 0;
	const parentCurrentTop = parentCurrent?.currentTop ?? 0;
	const parentReferenceLeft = parentReference?.currentLeft ?? 0;
	const parentReferenceTop = parentReference?.currentTop ?? 0;

	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(reference);
	const [originParentReferenceLeft, originParentReferenceTop] =
		parseTransformOrigin(parentReference);

	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(current);
	const [originParentCurrentLeft, originParentCurrentTop] = parseTransformOrigin(parentCurrent);

	const currentLeftDifference =
		current.currentLeft + originCurrentLeft - (parentCurrentLeft + originParentCurrentLeft);
	const referenceLeftDifference =
		reference.currentLeft + originReferenceLeft - (parentReferenceLeft + originParentReferenceLeft);

	const currentTopDifference =
		current.currentTop + originCurrentTop - (parentCurrentTop + originParentCurrentTop);
	const referenceTopDifference =
		reference.currentTop + originReferenceTop - (parentReferenceTop + originParentReferenceTop);

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
	const [current, reference] = child;
	const [parentCurrent, parentReference] = parent;
	const isParentEmpty = parentCurrent === undefined && parentReference === undefined;

	const parentCurrentWidth = parentCurrent?.currentWidth ?? 1;
	const parentCurrentHeight = parentCurrent?.currentHeight ?? 1;
	const parentReferenceWidth = parentReference?.currentWidth ?? 1;
	const parentReferenceHeight = parentReference?.currentHeight ?? 1;

	const parentWidthDifference = parentCurrentWidth / parentReferenceWidth;
	const parentHeightDifference = parentCurrentHeight / parentReferenceHeight;
	const childWidthDifference = current.unsaveWidth / reference.currentWidth;
	const childHeightDifference = current.unsaveHeight / reference.currentHeight;

	const scaleOverride = isTextNode && (childHeightDifference !== 0 || childWidthDifference !== 0);

	if (isParentEmpty) {
		return {
			parentWidthDifference,
			parentHeightDifference,
			heightDifference: scaleOverride ? 1 : childHeightDifference,
			widthDifference: scaleOverride ? 1 : childWidthDifference,
			textCorrection: 0,
		};
	}

	const heightDifference = (scaleOverride ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference = (scaleOverride ? 1 : childWidthDifference) / parentWidthDifference;

	const textCorrection = scaleOverride
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

	if (!parent[0]) {
		const leftDifference = currentLeftDifference - referenceLeftDifference - textCorrection;
		const topDifference = currentTopDifference - referenceTopDifference;

		return {
			heightDifference: save(heightDifference, 1),
			widthDifference: save(widthDifference, 1),
			leftDifference: save(leftDifference, 0),
			topDifference: save(topDifference, 0),
			offset: currentEntry.offset,
		};
	}

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
