import { DomTree } from "../types";
import { emptyComputedStle, emptyBoundClientRect } from "../utils/constants";
import { getChilden } from "../utils/helper";

const getComputedStyle = (element: HTMLElement) => {
	const shouldSkip = element.dataset.bewegungsSkip !== undefined;

	if (shouldSkip) {
		return emptyComputedStle;
	}

	const { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition } =
		window.getComputedStyle(element);

	return { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition };
};

const getBoundingClientRect = (element: HTMLElement) => {
	const shouldSkip = element.dataset.bewegungsSkip !== undefined;

	if (shouldSkip) {
		return emptyBoundClientRect;
	}

	const { top, left, width, height } = element.getBoundingClientRect();

	return {
		currentTop: top,
		currentLeft: left,
		currentWidth: width,
		currentHeight: height,
		unsaveWidth: width,
		unsaveHeight: height,
	};
};

//todo: we need to stop reading if a child is a root element
export const readElementStyles = (
	element: HTMLElement,
	parent: DomTree | null,
	offset: number
): DomTree => {
	const key = element.dataset.bewegungsKey!;
	const ratio = element.dataset.bewegungsRatio ?? "";
	const text = element.dataset.bewegungsText ?? "";
	const parentRoot = element.dataset.parentRoot ?? "";

	const treeNode: DomTree = {
		style: {
			...getBoundingClientRect(element),
			...getComputedStyle(element),
			ratio,
			text,
			offset,
		},
		key,
		children: [],
		parent,
		parentRoot,
	};

	const children = treeNode.style.display === "none" ? [] : getChilden(element);

	//todo: if we dont use the parentLookup, we can remove that as well
	children.forEach((element) => {
		if (element.dataset.bewegungsRoot) {
			return;
		}
		treeNode.children.push(readElementStyles(element, treeNode, offset));
	});

	return treeNode;
};
