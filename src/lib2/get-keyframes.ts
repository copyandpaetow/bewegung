import { calculateBorderRadius } from "./default/border-radius";
import { calculateDimensionDifferences } from "./default/calculate-differences";
import { calculateEasings } from "./default/easings";
import { DimensionalDifferences, NormalizedProps, TreeStyleWithOffset } from "./types";

export const getEmptyReadouts = (readouts: TreeStyleWithOffset[]) => {
	return readouts.map((readouts) => ({
		currentTop: 0,
		currentLeft: 0,
		currentWidth: 1,
		currentHeight: 1,
		unsaveWidth: 1,
		unsaveHeight: 1,
		position: "static",
		transform: "none",
		transformOrigin: "0px 0px",
		objectFit: "fill",
		objectPosition: "50% 50%",
		display: "block",
		borderRadius: "0px",
		ratio: -1,
		text: 0,
		offset: readouts.offset,
	}));
};

export const isEntryVisible = (entry: TreeStyleWithOffset) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

//? we would need to know all offsets here? Are the roots save for that?
export const normalizeStyles = (
	readouts: TreeStyleWithOffset[],
	parentReadouts: TreeStyleWithOffset[]
): TreeStyleWithOffset[] => {
	const updatedReadouts: TreeStyleWithOffset[] = [];
	parentReadouts
		.map((parentReadout) => parentReadout.offset)
		.forEach((offset) => {
			const nextIndex = readouts.findIndex((entry) => entry.offset === offset);
			const correspondingReadout = readouts[nextIndex];

			if (correspondingReadout && isEntryVisible(correspondingReadout)) {
				updatedReadouts.push(correspondingReadout);
				return;
			}

			const nextVisibleReadout =
				readouts.slice(nextIndex).find(isEntryVisible) || updatedReadouts.at(-1);

			if (!nextVisibleReadout) {
				//If there is no visible next element and not a previous one, the element is always hidden and can be deleted
				return;
			}

			if (correspondingReadout) {
				updatedReadouts.push({
					...nextVisibleReadout,
					display: correspondingReadout.display,
					unsaveHeight: 0,
					unsaveWidth: 0,
					offset,
				});
				return;
			}

			updatedReadouts.push({
				...nextVisibleReadout,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset,
			});
		});

	return updatedReadouts;
};

export type DifferenceArray = [TreeStyleWithOffset, TreeStyleWithOffset];

export const getBorderRadius = (calculatedProperties: TreeStyleWithOffset[]) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.borderRadius === "0px")) {
		return styleTable;
	}

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = calculateBorderRadius(style);
	});
	return styleTable;
};

export const isElementUnchanged = ({
	leftDifference,
	topDifference,
	widthDifference,
	heightDifference,
}: DimensionalDifferences) =>
	leftDifference === 0 && topDifference === 0 && widthDifference === 1 && heightDifference === 1;

export const getKeyframes = (
	readouts: TreeStyleWithOffset[],
	parentReadouts: TreeStyleWithOffset[],
	rootOptions: NormalizedProps[]
): {
	keyframes: Keyframe[];
	overrides: {};
} => {
	const differences = readouts.map((currentReadout) => {
		const child: DifferenceArray = [currentReadout, readouts.at(-1)!];
		const correspondingParentEntry = parentReadouts?.find(
			(entry) => entry.offset === currentReadout.offset
		)!;
		const parentReadout: DifferenceArray = [correspondingParentEntry, parentReadouts.at(-1)!];

		return calculateDimensionDifferences(child, parentReadout);
	});
	if (differences.every(isElementUnchanged)) {
		return { keyframes: [], overrides: {} };
	}

	const borderRadius = getBorderRadius(readouts);
	const easing = calculateEasings(rootOptions);

	return {
		overrides: {},
		keyframes: differences.map(
			({ leftDifference, topDifference, widthDifference, heightDifference, offset }) => {
				return {
					transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
					easing: easing[offset],
					...(borderRadius[offset] && {
						clipPath: borderRadius[offset] ? `inset(0px round ${borderRadius[offset]})` : "",
					}),
				};
			}
		),
	};
};