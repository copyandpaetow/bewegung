import {
	AnimationFlag,
	DimensionalDifferences,
	EasingTable,
	ImageDetails,
	ParentTree,
	TreeStyle,
} from "../types";
import { defaultImageStyles } from "../utils/constants";
import { calculateBorderRadius } from "./border-radius";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	getWrapperStyle,
	highestNumber,
} from "./calculate-image-differences";
import { calculateEasings } from "./easings";

export const getEmptyReadouts = (readouts: TreeStyle[]) => {
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
		ratio: "",
		text: "",
		offset: readouts.offset,
	}));
};

export const isEntryVisible = (entry: TreeStyle) =>
	entry.display !== "none" && entry.unsaveWidth !== 0 && entry.unsaveHeight !== 0;

export const normalizeStyles = (
	readouts: TreeStyle[],
	parentReadouts: TreeStyle[]
): TreeStyle[] => {
	const updatedReadouts: TreeStyle[] = [];

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

			updatedReadouts.push({
				...nextVisibleReadout,
				display: correspondingReadout ? correspondingReadout.display : nextVisibleReadout.display,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset,
			});

			return;
		});

	return updatedReadouts;
};

export const getBorderRadius = (calculatedProperties: TreeStyle[]) => {
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

const isHiddenBecauseOfParent = ({
	leftDifference,
	topDifference,
	widthDifference,
	heightDifference,
}: DimensionalDifferences) => {
	const samePosition = leftDifference === 0 && topDifference === 0;
	const hiddenOrDefaultWidth = widthDifference === 1 || widthDifference === 0;
	const hiddenOrDefaultHeight = heightDifference === 1 || heightDifference === 0;

	return samePosition && hiddenOrDefaultWidth && hiddenOrDefaultHeight;
};

const getDifferences = (readouts: TreeStyle[], parentReadouts: TreeStyle[]) =>
	readouts.map((currentReadout) =>
		calculateDimensionDifferences({
			current: currentReadout,
			reference: readouts.at(-1)!,
			parent: parentReadouts?.find((entry) => entry.offset === currentReadout.offset)!,
			parentReference: parentReadouts.at(-1)!,
		})
	);

const getRootDifferences = (readouts: TreeStyle[]) =>
	readouts.map((currentReadout) =>
		calculateRootDifferences({
			current: currentReadout,
			reference: readouts.at(-1)!,
		})
	);

const animationNotNeeded = (
	readouts: TreeStyle[],
	differences: DimensionalDifferences[],
	flag: AnimationFlag
) => {
	if (readouts.length === 0 || differences.length === 0) {
		return true;
	}
	const isImage = Boolean(readouts.at(-1)!.ratio);

	if (
		isImage &&
		readouts.some(
			(entry) =>
				entry.unsaveWidth !== readouts.at(-1)!.unsaveWidth ||
				entry.unsaveHeight !== readouts.at(-1)!.unsaveHeight
		)
	) {
		return false;
	}

	return (
		differences.every(isElementUnchanged) ||
		(flag === "removal" && differences.every(isHiddenBecauseOfParent))
	);
};

const getDefaultKeyframes = (
	differences: DimensionalDifferences[],
	readouts: TreeStyle[],
	easing: EasingTable
) => {
	const borderRadius = getBorderRadius(readouts);

	return differences.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }) => {
			return {
				offset,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
				easing: easing[offset],
				...(borderRadius[offset] && {
					clipPath: borderRadius[offset] ? `inset(0px round ${borderRadius[offset]})` : "",
				}),
			};
		}
	);
};

const getImageKeyframes = (current: ParentTree, parent: ParentTree, easing: EasingTable) => {
	const { style: readouts, overrides } = current;
	const { style: parentReadouts } = parent;

	const imageData: ImageDetails = {
		easing,
		maxHeight: highestNumber(readouts.map((style) => style.currentHeight)),
		maxWidth: highestNumber(readouts.map((style) => style.currentWidth)),
	};

	const imageKeyframes = calculateImageKeyframes(readouts, easing);

	if (imageKeyframes.length === 0) {
		return [];
	}
	overrides.styles = {
		...overrides.styles,
		...defaultImageStyles,
	};

	overrides.wrapper = {
		keyframes: getWrapperKeyframes(readouts, parentReadouts, imageData),
		style: getWrapperStyle(current, parent, imageData),
	};
	overrides.placeholder = {
		style: {
			height: readouts.at(-1)!.unsaveHeight + "px",
			width: readouts.at(-1)!.unsaveWidth + "px",
		},
	};

	return imageKeyframes;
};

export const getKeyframes = (current: ParentTree, parent: ParentTree): Keyframe[] => {
	const { style: readouts, easings } = current;
	const { style: parentReadouts, flag, isRoot } = parent;

	const differences = isRoot
		? getRootDifferences(readouts)
		: getDifferences(readouts, parentReadouts);

	if (animationNotNeeded(readouts, differences, flag)) {
		return [];
	}

	const easing = calculateEasings(easings);
	const isImage = Boolean(readouts.at(-1)!.ratio);

	if (isImage) {
		return getImageKeyframes(current, parent, easing);
	}

	return getDefaultKeyframes(differences, readouts, easing);
};
