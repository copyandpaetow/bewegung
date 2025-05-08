import { getDifferences } from "../keyframes/diff";
import { Readout } from "./readout";

export const resetHiddenElement = (
	readout: Readout,
	parentReadout: Readout,
	previousParentReadout: Readout
) => {
	const [left, top, width, height] = readout.dimensions;
	const [parentLeft, parentTop] = parentReadout.dimensions;
	const [borderLeftWidth, borderTopWidth] = parentReadout.borderWidth;

	const delta = getDifferences(
		readout,
		readout,
		parentReadout,
		previousParentReadout
	);

	return {
		position: "fixed",
		zIndex: 0,
		display: readout.display,
		left:
			left -
			(parentLeft ?? 0) -
			(borderLeftWidth ?? 0) +
			delta.leftDifference +
			"px",
		top:
			top -
			(parentTop ?? 0) -
			(borderTopWidth ?? 0) +
			delta.topDifference +
			"px",
		width: width + "px",
		height: height + "px",
	};
};
