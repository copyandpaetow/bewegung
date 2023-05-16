import { DomTree } from "./types";

const getRatio = (element: HTMLElement) => {
	//@ts-expect-error
	return (element.naturalWidth ?? 1) / (element.naturalHeight ?? -1);
};

const isTextElement = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType === 3 && node.textContent!.trim().length) {
			text += 1;
		}
	});
	return text;
};

//TODO: maybe we can store the text content directly
export function createSerializableElement(element: HTMLElement): DomTree {
	const root = element.dataset.bewegungsRoot ?? "";
	const easings = element.dataset.bewegungsEasing ?? "";
	const key = element.dataset.bewegungsKey!;
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
			ratio: getRatio(element),
			text: isTextElement(element),
		},
		key,
		root,
		easings,
		children: Array.from(element.children).map((element) =>
			createSerializableElement(element as HTMLElement)
		),
	};
}
