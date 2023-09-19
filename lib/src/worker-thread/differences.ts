import {
	ChildParentDimensions,
	DimensionalDifferences,
	RootDimensions,
	TreeElement,
} from "../types";
import { save } from "../utils/helper";

export const getTranslates = (dimensions: ChildParentDimensions) => {
	const { current, parent, parentReference, reference } = dimensions;

	const [originReferenceLeft, originReferenceTop] = reference.transformOrigin;
	const [originParentReferenceLeft, originParentReferenceTop] = parentReference.transformOrigin;

	const [originCurrentLeft, originCurrentTop] = current.transformOrigin;
	const [originParentCurrentLeft, originParentCurrentTop] = parent.transformOrigin;

	const currentLeftDifference =
		current.currentLeft + originCurrentLeft - (parent.currentLeft + originParentCurrentLeft);
	const referenceLeftDifference =
		reference.currentLeft +
		originReferenceLeft -
		(parentReference.currentLeft + originParentReferenceLeft);

	const currentTopDifference =
		current.currentTop + originCurrentTop - (parent.currentTop + originParentCurrentTop);
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

export const getScales = (dimensions: ChildParentDimensions) => {
	const { current, parent, parentReference, reference } = dimensions;

	const parentWidthDifference = parent.currentWidth / parentReference.currentWidth;
	const parentHeightDifference = parent.currentHeight / parentReference.currentHeight;
	const childWidthDifference = current.unsaveWidth / reference.currentWidth;
	const childHeightDifference = current.unsaveHeight / reference.currentHeight;

	const heightDifference = childHeightDifference / parentHeightDifference;
	const widthDifference = childWidthDifference / parentWidthDifference;

	const textWidthCorrection =
		(current.currentWidth - reference.currentWidth) / 2 / parentWidthDifference;

	const textHeightCorrection =
		(current.currentHeight - reference.currentHeight) / 2 / parentHeightDifference;

	return {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textWidthCorrection,
		textHeightCorrection,
	};
};

export const calculateDimensionDifferences = (
	dimensions: ChildParentDimensions
): DimensionalDifferences => {
	const { current } = dimensions;
	const isTextElement = Boolean((current as TreeElement)?.text);

	const {
		currentLeftDifference,
		referenceLeftDifference,
		currentTopDifference,
		referenceTopDifference,
	} = getTranslates(dimensions);

	const {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textWidthCorrection,
		textHeightCorrection,
	} = getScales(dimensions);

	const leftDifference = currentLeftDifference / parentWidthDifference - referenceLeftDifference;
	const topDifference = currentTopDifference / parentHeightDifference - referenceTopDifference;

	const differences = {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: current.offset,
	};

	if (isTextElement) {
		return {
			heightDifference: save(1 / parentHeightDifference, 1),
			widthDifference: save(1 / parentWidthDifference, 1),
			leftDifference: save(leftDifference - textWidthCorrection, 0),
			topDifference: save(topDifference - textHeightCorrection, 0),
			offset: current.offset,
		};
	}

	return differences;
};

export const calculateRootDifferences = ({
	current,
	reference,
}: RootDimensions): DimensionalDifferences => {
	const [originReferenceLeft, originReferenceTop] = reference.transformOrigin;
	const [originCurrentLeft, originCurrentTop] = current.transformOrigin;

	const currentLeftDifference = current.currentLeft + originCurrentLeft;
	const referenceLeftDifference = reference.currentLeft + originReferenceLeft;
	const currentTopDifference = current.currentTop + originCurrentTop;
	const referenceTopDifference = reference.currentTop + originReferenceTop;

	const widthDifference = current.unsaveWidth / reference.currentWidth;
	const heightDifference = current.unsaveHeight / reference.currentHeight;

	/*
		Apparently, chrome will keep the viewport from jumping when the size of an element is changed,
		depending on where the element-to-be-changed is, this will move either everything below the element but keep it in view or move everything above 
		(by jumping down in the page) and lead to weird behaviour
		The first condition can be true if the element shrinks, so therefore we also need to check if the element needs to be scaled down

	const weirdBrowserBehaviorCorrectionLeft = reference.currentLeft < 0 ? -1 : 1;
	const weirdBrowserBehaviorCorrectionTop = reference.currentTop < 0 ? -1 : 1;

	const leftDifference =
		(currentLeftDifference - referenceLeftDifference) * weirdBrowserBehaviorCorrectionLeft;
	const topDifference =
		(currentTopDifference - referenceTopDifference) * weirdBrowserBehaviorCorrectionTop;
		*/

	const leftDifference = currentLeftDifference - referenceLeftDifference;
	const topDifference = currentTopDifference - referenceTopDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: current.offset,
	};
};
