import { ChildParentDimensions, DimensionalDifferences, TreeStyleWithOffset } from "../types";
import { save } from "../utils/helper";

export const parseTransformOrigin = (entry: TreeStyleWithOffset) => {
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

export const getTranslates = (dimensions: ChildParentDimensions) => {
	const { current, parent, parentReference, reference } = dimensions;

	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(reference);
	const [originParentReferenceLeft, originParentReferenceTop] =
		parseTransformOrigin(parentReference);

	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(current);
	const [originParentCurrentLeft, originParentCurrentTop] = parseTransformOrigin(parent);

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

	const textCorrection =
		(parent.currentWidth - parentReference.currentWidth) / 2 / parentWidthDifference;

	return {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		textCorrection,
	};
};

export const calculateDimensionDifferences = (
	dimensions: ChildParentDimensions
): DimensionalDifferences => {
	const { current } = dimensions;
	const isTextElement = current.text > 0;

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
		textCorrection,
	} = getScales(dimensions);

	//TODO: this can be dryed / improved
	if (isTextElement) {
		const leftDifference =
			currentLeftDifference / parentWidthDifference - referenceLeftDifference - textCorrection;
		const topDifference = currentTopDifference / parentHeightDifference - referenceTopDifference;

		return {
			heightDifference: save(1 / parentHeightDifference, 1),
			widthDifference: save(1 / parentWidthDifference, 1),
			leftDifference: save(leftDifference, 0),
			topDifference: save(topDifference, 0),
			offset: current.offset,
		};
	}

	const leftDifference = currentLeftDifference / parentWidthDifference - referenceLeftDifference;
	const topDifference = currentTopDifference / parentHeightDifference - referenceTopDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: current.offset,
	};
};

//TODO: This needs to be reapplied to the root
//? maybe it would be nice to have some type system for animations, like text, root, image etc
export const calculateRootDifferences = (
	current: TreeStyleWithOffset,
	reference: TreeStyleWithOffset
) => {
	const [originReferenceLeft, originReferenceTop] = parseTransformOrigin(reference);
	const [originCurrentLeft, originCurrentTop] = parseTransformOrigin(current);

	const currentLeftDifference = current.currentLeft + originCurrentLeft;
	const referenceLeftDifference = reference.currentLeft + originReferenceLeft;
	const currentTopDifference = current.currentTop + originCurrentTop;
	const referenceTopDifference = reference.currentTop + originReferenceTop;

	const widthDifference = current.unsaveWidth / reference.currentWidth;
	const heightDifference = current.unsaveHeight / reference.currentHeight;

	/*
		Apparently, the browser will keep the viewport from jumping when the size of an element is changed,
		depending on where the element-to-be-changed is, this will move either everything below the element but keep it in view or move everything above 
		(by jumping down in the page) and lead to weird behaviour
		The first condition can be true if the element shrinks, so therefore we also need to check if the element needs to be scaled down

		*/

	const weirdBrowserBehaviorCorrectionTop =
		currentTopDifference > referenceTopDifference && heightDifference < 1 ? -1 : 1;
	const weirdBrowserBehaviorCorrectionLeft =
		currentLeftDifference > referenceLeftDifference && widthDifference < 1 ? -1 : 1;

	const leftDifference =
		(currentLeftDifference - referenceLeftDifference) * weirdBrowserBehaviorCorrectionLeft;
	const topDifference =
		(currentTopDifference - referenceTopDifference) * weirdBrowserBehaviorCorrectionTop;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		leftDifference: save(leftDifference, 0),
		topDifference: save(topDifference, 0),
		offset: current.offset,
	};
};
