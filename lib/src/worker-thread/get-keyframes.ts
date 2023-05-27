import {
	AnimationFlag,
	DimensionalDifferences,
	DomTree,
	ImageDetails,
	TreeStyle,
	WorkerState,
} from "../types";
import { defaultImageStyles, emptyBoundClientRect, emptyComputedStle } from "../utils/constants";
import {
	doesElementChangeInScale,
	isElementUnchanged,
	isHiddenBecauseOfParent,
} from "../utils/predicates";
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
		...emptyComputedStle,
		...emptyBoundClientRect,
		ratio: "",
		text: "",
		offset: readouts.offset,
	}));
};

export const getBorderRadius = (
	calculatedProperties: TreeStyle[],
	key: string,
	overrides: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const styleTable: Record<number, string> = {};

	if (calculatedProperties.every((style) => style.borderRadius === "0px")) {
		return styleTable;
	}

	overrides.set(key, {
		...(overrides.get(key) ?? {}),
		borderRadius: "0px",
	});

	calculatedProperties.forEach((style) => {
		styleTable[style.offset] = calculateBorderRadius(style);
	});
	return styleTable;
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

	if (isImage && doesElementChangeInScale(readouts)) {
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
	const borderRadius = getBorderRadius(readouts, tree.key, state.overrides);
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

const getParentKey = (tree: DomTree, state: WorkerState): string => {
	if (!tree.parent) {
		return "";
	}
	if (state.keyframes.get(tree.parent.key)?.length) {
		return tree.parent.key;
	}

	return getParentKey(tree.parent, state);
};

export const setKeyframes = (tree: DomTree, state: WorkerState) => {
	const parentKey = getParentKey(tree, state);

	const parentReadouts = state.readouts.get(parentKey)!;
	const readouts = state.readouts.get(tree.key)!;
	const flag = state.flags.get(tree.key);

	const differences = !parentKey
		? getRootDifferences(readouts)
		: getDifferences(readouts, parentReadouts);

	//TODO: currently if an element gets removed and its an image, it still get the image treatment, which is not needed
	//? but if the element changes before and is then removed it would be needed
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
