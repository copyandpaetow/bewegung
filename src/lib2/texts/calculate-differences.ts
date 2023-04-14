import { parseTransformOrigin } from "../default/calculate-differences";
import { DifferenceArray, DimensionalDifferences } from "../types";
import { save } from "../utils/helper";

export const getTranslates = (child: DifferenceArray, parent: DifferenceArray) => {
	const [current, reference] = child;
	const [parentCurrent, parentReference] = parent;

	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(reference);
	const [originParentReferenceLeft, originParentReferenceTop] =
		parseTransformOrigin(parentReference);

	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(current);
	const [originParentCurrentLeft, originParentCurrentTop] = parseTransformOrigin(parentCurrent);

	const currentLeftDifference =
		current.currentLeft + originCurrentLeft - (parentCurrent.currentLeft + originParentCurrentLeft);
	const referenceLeftDifference =
		reference.currentLeft +
		originReferenceLeft -
		(parentReference.currentLeft + originParentReferenceLeft);

	const currentTopDifference =
		current.currentTop + originCurrentTop - (parentCurrent.currentTop + originParentCurrentTop);
	const referenceTopDifference =
		reference.currentTop +
		originReferenceTop -
		(parentReference.currentTop + originParentReferenceTop);

	return {
		currentLeftDifference,
		referenceLeftDifference,
		currentTopDifference,
		referenceTopDifference,
	};
};

export const getTextScales = (child: DifferenceArray, parent: DifferenceArray) => {
	const [current, reference] = child;
	const [parentCurrent, parentReference] = parent;

	const parentWidthDifference = parentCurrent.currentWidth / parentReference.currentWidth;
	const parentHeightDifference = parentCurrent.currentHeight / parentReference.currentHeight;
	const childWidthDifference = current.unsaveWidth / reference.currentWidth;
	const childHeightDifference = current.unsaveHeight / reference.currentHeight;

	const scaleOverride = childHeightDifference !== 0 || childWidthDifference !== 0;

	const heightDifference = (scaleOverride ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference = (scaleOverride ? 1 : childWidthDifference) / parentWidthDifference;

	const textCorrection = scaleOverride
		? (parentCurrent.currentWidth - parentReference.currentWidth) / 2 / parentWidthDifference
		: 0;

	return {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textCorrection,
	};
};

export const calculateTextDifferences = (
	child: DifferenceArray,
	parent: DifferenceArray
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
	} = getTextScales(child, parent);

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
