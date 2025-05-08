import { Readout } from "../element/readout";

export const getDifferences = (
	readout: Readout,
	previousReadout: Readout,
	parentReadout: Readout,
	previousParentReadout: Readout
) => {
	const [toLeft, toTop, toWidth, toHeight] = readout.dimensions;
	const [toParentLeft, toParentTop, toParentWidth, toParentHeight] =
		parentReadout.dimensions;
	const [originToLeft, originToTop] = readout.transformOrigin;
	const [originToParentLeft, originToParentTop] = parentReadout.transformOrigin;

	const [fromLeft, fromTop, fromWidth, fromHeight] = previousReadout.dimensions;
	const [fromParentLeft, fromParentTop, fromParentWidth, fromParentHeight] =
		previousParentReadout.dimensions;
	const [originFromLeft, originFromTop] = previousReadout.transformOrigin;
	const [originFromParentLeft, originFromParentTop] =
		previousParentReadout.transformOrigin;

	const parentWidthDifference = fromParentWidth / toParentWidth;
	const parentHeightDifference = fromParentHeight / toParentHeight;
	const childWidthDifference = fromWidth / toWidth;
	const childHeightDifference = fromHeight / toHeight;

	const heightDifference = childHeightDifference / parentHeightDifference;
	const widthDifference = childWidthDifference / parentWidthDifference;

	const currentLeftDifference =
		fromLeft + originFromLeft - (fromParentLeft + originFromParentLeft);
	const referenceLeftDifference =
		toLeft + originToLeft - (toParentLeft + originToParentLeft);

	const currentTopDifference =
		fromTop + originFromTop - (fromParentTop + originFromParentTop);
	const referenceTopDifference =
		toTop + originToTop - (toParentTop + originToParentTop);

	const leftDifference =
		currentLeftDifference / parentWidthDifference - referenceLeftDifference;
	const topDifference =
		currentTopDifference / parentHeightDifference - referenceTopDifference;

	return {
		parentWidthDifference,
		parentHeightDifference,
		heightDifference,
		widthDifference,
		leftDifference,
		topDifference,
	};
};
