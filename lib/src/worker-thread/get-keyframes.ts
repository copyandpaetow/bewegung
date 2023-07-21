import { ImageDetails, Result, ResultTree, TreeStyle } from "../types";
import { defaultImageStyles, emptyBoundClientRect, emptyComputedStle } from "../utils/constants";
import { calculateBorderRadius } from "./border-radius";
import { getWrapperKeyframes } from "./calculate-image-differences";

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
	tree: ResultTree,
	overrides: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const styleTable = new Map<number, string>();

	tree.readouts.forEach((style, offset) => {
		if (style.borderRadius === "0px") {
			return;
		}
		styleTable.set(offset, calculateBorderRadius(style));
	});

	if (styleTable.size > 0) {
		const currentOverride = overrides.get(tree.key) ?? {};
		
		currentOverride.borderRadius = "0px";
		overrides.set(tree.key, currentOverride);
	}

	return styleTable;
};

export const setDefaultKeyframes = (
	tree: ResultTree,
	overrides: Map<string, Partial<CSSStyleDeclaration>>
): Keyframe[] => {
	const borderRadius = getBorderRadius(tree, overrides);

	return tree.differences.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset, easing }) => {
			return {
				offset,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference})`,
				easing,
				...(borderRadius.has(offset) && {
					clipPath: borderRadius.get(offset) ? `inset(0px round ${borderRadius.get(offset)})` : "",
				}),
			};
		}
	);
};

export const getImageData = (readouts: TreeStyle[]): ImageDetails => {
	let maxHeight = 0;
	let maxWidth = 0;

	readouts.forEach((style) => {
		maxHeight = Math.max(maxHeight, style.currentHeight);
		maxWidth = Math.max(maxWidth, style.currentWidth);
	});

	return { maxHeight, maxWidth };
};

export const setImageRelatedKeyframes = (
	tree: ResultTree,
	parent: ResultTree | undefined,
	result: Result
) => {
	const parentReadouts = parent?.readouts;
	const readouts = tree.readouts;
	const lastReadout = readouts.at(1)!;
	const lastParentReadout = parentReadouts?.at(1);
	const imageData = getImageData(tree.readouts);

	if (!parent) {
		//todo: handle images as root
		throw new Error("images need a parent");
	}
	result.keyframes.set(
		`${tree.key}-wrapper`,
		getWrapperKeyframes(tree.readouts, parent.readouts, imageData)
	);

	result.overrides.set(`${tree.key}-wrapper`, {
		position: "absolute",
		left: lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
		top: lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
		height: `${imageData.maxHeight}px`,
		width: `${imageData.maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	});

	result.overrides.set(`${tree.key}-placeholder`, {
		height: lastReadout.unsaveHeight + "px",
		width: lastReadout.unsaveWidth + "px",
	});

	return;
};
