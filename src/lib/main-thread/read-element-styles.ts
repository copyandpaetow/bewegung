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

export const readElementStyles = (element: HTMLElement, offset: number): DomTree => {
	const easings = element.dataset.bewegungsEasing ?? "";
	const key = element.dataset.bewegungsKey!;
	const ratio = element.dataset.bewegungsRatio ?? "";
	const text = element.dataset.bewegungsText ?? "";

	return {
		style: {
			...getBoundingClientRect(element),
			...getComputedStyle(element),
			ratio,
			text,
			offset,
		},
		key,
		easings,
		children: getChilden(element).map((element) => readElementStyles(element, offset)),
	};
};
