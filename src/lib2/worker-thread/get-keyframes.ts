import {
	AnimationFlag,
	DimensionalDifferences,
	DomTree,
	ImageDetails,
	TreeStyle,
	WorkerState,
} from "../types";
import { defaultImageStyles } from "../utils/constants";
import { calculateBorderRadius } from "./border-radius";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	highestNumber,
} from "./calculate-image-differences";
import { calculateEasings } from "./easings";

//TODO: this file needs some cleanup

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
	flag: AnimationFlag | undefined
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

const setDefaultKeyframes = (
	differences: DimensionalDifferences[],
	tree: DomTree,
	state: WorkerState
) => {
	const readouts = state.readouts.get(tree.key)!;
	const borderRadius = getBorderRadius(readouts);
	const easing = calculateEasings(state.easings.get(tree.key)!);

	const keyframes = differences.map(
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

	state.keyframes.set(tree.key, keyframes);
};

const setImageKeyframes = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const parentReadouts = state.readouts.get(parentKey)!;
	const readouts = state.readouts.get(tree.key)!;

	const imageData: ImageDetails = {
		easing: calculateEasings(state.easings.get(tree.key)!),
		maxHeight: highestNumber(readouts.map((style) => style.currentHeight)),
		maxWidth: highestNumber(readouts.map((style) => style.currentWidth)),
	};

	const imageKeyframes = calculateImageKeyframes(readouts, imageData.easing);

	if (imageKeyframes.length === 0) {
		return [];
	}

	state.keyframes.set(tree.key, imageKeyframes);
	state.keyframes.set(
		`${tree.key}-wrapper`,
		getWrapperKeyframes(readouts, parentReadouts, imageData)
	);

	state.overrides.set(tree.key, { ...state.overrides.get(tree.key), ...defaultImageStyles });
	state.overrides.set(`${tree.key}-placeholder`, {
		height: readouts.at(-1)!.unsaveHeight + "px",
		width: readouts.at(-1)!.unsaveWidth + "px",
	});
	state.overrides.set(`${tree.key}-wrapper`, {
		position: "absolute",
		left: readouts.at(-1)!.currentLeft - (parentReadouts?.at(-1)!.currentLeft ?? 0) + "px",
		top: readouts.at(-1)!.currentTop - (parentReadouts?.at(-1)!.currentTop ?? 0) + "px",
		height: `${imageData.maxHeight}px`,
		width: `${imageData.maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	});

	const parentOverrides = state.overrides.get(parentKey);
	if (parentReadouts.at(-1)!.position === "static" && !parentOverrides?.position) {
		state.overrides.set(parentKey, {
			...parentOverrides,
			position: "relative",
		});
	}

	return imageKeyframes;
};

export const setKeyframes = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const parentReadouts = state.readouts.get(parentKey)!;
	const readouts = state.readouts.get(tree.key)!;
	const flag = state.flags.get(tree.key);

	const differences = !parentKey
		? getRootDifferences(readouts)
		: getDifferences(readouts, parentReadouts);

	if (animationNotNeeded(readouts, differences, flag)) {
		state.keyframes.set(tree.key, []);
		return;
	}

	const isImage = Boolean(readouts.at(-1)!.ratio);

	if (!isImage) {
		setDefaultKeyframes(differences, tree, state);
		return;
	}
	setImageKeyframes(tree, parentKey, state);
};
