import { ImageDetails, TreeElement } from "../types";
import { calculateImageDifferences, getWrapperKeyframes } from "./image-differences";
import { setParentToRelative } from "./overrides";

const calculateWrapperData = (current: TreeElement[], parent: TreeElement[] | undefined) => {
	const lastReadout = current.at(-1)!;
	const lastParentReadout = parent ? parent.at(-1) : undefined;
	const imageData = getImageData(current as TreeElement[]);
	const keyframes = getWrapperKeyframes(current as TreeElement[], parent, imageData);

	const overrides = {
		position: "absolute",
		left: lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
		top: lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
		height: `${imageData.maxHeight}px`,
		width: `${imageData.maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	};

	return { keyframes, overrides };
};

//TODO: this was written when there where more than 2 readouts, maybe it can be reduced / simplified?
export const getImageData = (readouts: TreeElement[]): ImageDetails => {
	let maxHeight = 0;
	let maxWidth = 0;

	readouts.forEach((style) => {
		maxHeight = Math.max(maxHeight, style.currentHeight);
		maxWidth = Math.max(maxWidth, style.currentWidth);
	});

	return { maxHeight, maxWidth };
};

export const setImageKeyframes = (
	dimensions: [TreeElement, TreeElement],
	parentDimensions: [TreeElement, TreeElement] | undefined,
	imageKeyframeStore: Map<string, Keyframe[]>,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const { keyframes, overrides } = calculateWrapperData(dimensions, parentDimensions);
	const [current] = dimensions;
	const key = current.key;

	imageKeyframeStore.set(key, calculateImageDifferences(dimensions));
	imageKeyframeStore.set(`${key}-wrapper`, keyframes);
	overrideStore.set(`${key}-wrapper`, overrides);

	setParentToRelative(parentDimensions?.at(-1), overrideStore);
};
