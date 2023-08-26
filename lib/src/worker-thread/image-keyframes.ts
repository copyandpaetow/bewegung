import { ImageDetails, TreeEntry, TreeMedia } from "../types";
import { calculateImageDifferences, getWrapperKeyframes } from "./calculate-image-differences";

export const calculateWrapperData = (current: TreeEntry[], parent: TreeEntry[] | undefined) => {
	const lastReadout = current.at(-1)!;
	const lastParentReadout = parent ? parent.at(-1) : undefined;
	const imageData = getImageData(current as TreeMedia[]);
	const keyframes = getWrapperKeyframes(current as TreeMedia[], parent, imageData);

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

//TODO: this needs to go to where the images live
export const getImageData = (readouts: TreeMedia[]): ImageDetails => {
	let maxHeight = 0;
	let maxWidth = 0;

	readouts.forEach((style) => {
		maxHeight = Math.max(maxHeight, style.currentHeight);
		maxWidth = Math.max(maxWidth, style.currentWidth);
	});

	return { maxHeight, maxWidth };
};

export const setImageKeyframes = (
	dimensions: [TreeMedia, TreeMedia],
	parentDimensions: [TreeMedia, TreeMedia] | undefined,
	imageKeyframeStore: Map<string, Keyframe[]>,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const { keyframes, overrides } = calculateWrapperData(dimensions, parentDimensions);
	const current = dimensions[0];
	const key = current.key;

	imageKeyframeStore.set(key, calculateImageDifferences(dimensions));
	imageKeyframeStore.set(`${key}-wrapper`, keyframes);
	overrideStore.set(`${key}-wrapper`, overrides);

	overrideStore.set(`${key}-placeholder`, {
		height: current.unsaveHeight + "px",
		width: current.unsaveWidth + "px",
	});
};
