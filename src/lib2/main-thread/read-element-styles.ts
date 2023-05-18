import { DomTree } from "../types";
import { getChilden } from "../utils/helper";

const emptyBoundClientRect = {
	top: 0,
	left: 0,
	width: 1,
	height: 1,
};

const emptyComputedStle = {
	display: "block",
	borderRadius: "0px",
	position: "static",
	transform: "none",
	transformOrigin: "0px 0px",
	objectFit: "fill",
	objectPosition: "50% 50%",
};

const getComputedStyle = (element: HTMLElement) => {
	const shouldSkip = element.dataset.bewegungsSkip !== undefined;

	return shouldSkip ? emptyComputedStle : window.getComputedStyle(element);
};

const getBoundingClientRect = (element: HTMLElement) => {
	const shouldSkip = element.dataset.bewegungsSkip !== undefined;

	return shouldSkip ? emptyBoundClientRect : element.getBoundingClientRect();
};

export function createSerializableElement(element: HTMLElement, offset: number): DomTree {
	const easings = element.dataset.bewegungsEasing ?? "";
	const key = element.dataset.bewegungsKey!;
	const ratio = element.dataset.bewegungsRatio ?? "";
	const text = element.dataset.bewegungsText ?? "";

	const { top, left, width, height } = getBoundingClientRect(element);
	const { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition } =
		getComputedStyle(element);

	return {
		style: {
			currentTop: top,
			currentLeft: left,
			currentWidth: width,
			currentHeight: height,
			unsaveWidth: width,
			unsaveHeight: height,
			position,
			transform,
			transformOrigin,
			objectFit,
			objectPosition,
			display,
			borderRadius,
			ratio,
			text,
			offset,
		},
		key,
		easings,
		children: getChilden(element).map((element) => createSerializableElement(element, offset)),
	};
}
