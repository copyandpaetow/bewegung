import { DimensionalDifferences, DomTree, ImageDetails, TreeStyle, WorkerState } from "../types";
import { defaultImageStyles, emptyBoundClientRect, emptyComputedStle } from "../utils/constants";
import { calculateBorderRadius } from "./border-radius";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	highestNumber,
} from "./calculate-image-differences";
import { calculateEasings } from "./easings";

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
	treeStyle: Map<number, TreeStyle>,
	key: string,
	overrides: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const styleTable = new Map<number, string>();

	treeStyle.forEach((style, offset) => {
		if (style.borderRadius === "0px") {
			return;
		}
		styleTable.set(offset, calculateBorderRadius(style));
	});

	if (styleTable.size > 0) {
		overrides.set(key, {
			...(overrides.get(key) ?? {}),
			borderRadius: "0px",
		});
	}

	return styleTable;
};

export const setDefaultKeyframes = (
	differences: DimensionalDifferences[],
	tree: DomTree,
	state: WorkerState
) => {
	const readouts = state.readouts.get(tree.key)!;
	const borderRadius = getBorderRadius(readouts, tree.key, state.overrides);
	const easing = calculateEasings(state.easings.get(tree.key));

	const keyframes = differences.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }) => {
			return {
				offset,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
				easing: easing.get(offset),
				...(borderRadius.has(offset) && {
					clipPath: borderRadius.get(offset) ? `inset(0px round ${borderRadius.get(offset)})` : "",
				}),
			};
		}
	);

	state.keyframes.set(tree.key, keyframes);
};

const getImageData = (tree: DomTree, state: WorkerState): ImageDetails => {
	const readouts = state.readouts.get(tree.key)!;
	const easing = calculateEasings(state.easings.get(tree.key));
	let maxHeight = 0;
	let maxWidth = 0;

	readouts.forEach((style) => {
		maxHeight = Math.max(maxHeight, style.currentHeight);
		maxWidth = Math.max(maxWidth, style.currentWidth);
	});

	return { easing, maxHeight, maxWidth };
};

export const setImageKeyframes = (tree: DomTree, parentKey: string, state: WorkerState) => {
	const parentReadouts = state.readouts.get(parentKey)!;
	const readouts = state.readouts.get(tree.key)!;
	const lastReadout = readouts.get(1)!;
	const lastParentReadout = parentReadouts.get(1);

	const imageData = getImageData(tree, state);

	const imageKeyframes = calculateImageKeyframes(Array.from(readouts.values()), imageData);

	if (imageKeyframes.length === 0) {
		return [];
	}

	state.keyframes.set(tree.key, imageKeyframes);
	state.keyframes.set(
		`${tree.key}-wrapper`,
		getWrapperKeyframes(Array.from(readouts.values()), parentReadouts, imageData)
	);

	state.overrides.set(tree.key, { ...state.overrides.get(tree.key), ...defaultImageStyles });
	state.overrides.set(`${tree.key}-placeholder`, {
		height: lastReadout.unsaveHeight + "px",
		width: lastReadout.unsaveWidth + "px",
	});
	state.overrides.set(`${tree.key}-wrapper`, {
		position: "absolute",
		left: lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
		top: lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
		height: `${imageData.maxHeight}px`,
		width: `${imageData.maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	});

	const parentOverrides = state.overrides.get(parentKey);
	if (lastParentReadout?.position === "static" && !parentOverrides?.position) {
		state.overrides.set(parentKey, {
			...parentOverrides,
			position: "relative",
		});
	}

	return imageKeyframes;
};
