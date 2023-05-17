import { DomTree } from "../types";

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

//TODO: maybe we can store the text content directly
export function createSerializableElement(element: HTMLElement): DomTree {
	const easings = element.dataset.bewegungsEasing ?? "";
	const key = element.dataset.bewegungsKey!;
	const ratio = element.dataset.bewegungsRatio ?? "";
	const text = element.dataset.bewegungsText ?? "";
	const shouldSkip = element.dataset.bewegungsSkip !== undefined;

	const { top, left, width, height } = shouldSkip
		? emptyBoundClientRect
		: element.getBoundingClientRect();
	const { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition } =
		shouldSkip ? emptyComputedStle : window.getComputedStyle(element);

	return {
		style: {
			currentTop: top,
			currentLeft: left,
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
		},
		key,
		easings,
		children: Array.from(element.children).map((element) =>
			createSerializableElement(element as HTMLElement)
		),
	};
}
