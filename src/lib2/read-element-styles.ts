import { DomTree } from "./types";

//TODO: maybe we can store the text content directly
export function createSerializableElement(element: HTMLElement): DomTree {
	const easings = element.dataset.bewegungsEasing ?? "";
	const key = element.dataset.bewegungsKey!;
	const ratio = element.dataset.bewegungsRatio ?? "";
	const text = element.dataset.bewegungsText ?? "";
	const { top, left, width, height } = element.getBoundingClientRect();
	const { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition } =
		window.getComputedStyle(element);

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
