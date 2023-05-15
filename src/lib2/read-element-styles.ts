import { Attributes, DomTree } from "./types";

const getRatio = (element: HTMLElement) => {
	//@ts-expect-error
	return (element.naturalWidth ?? 1) / (element.naturalHeight ?? -1);
};

const getKey = (element: HTMLElement, index: number) => {
	element.hasAttribute;
	if (!element.hasAttribute(Attributes.key)) {
		element.setAttribute(Attributes.key, `key-${element.tagName}-${index}`);
	}
	return element.getAttribute(Attributes.key)!;
};

const isTextElement = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType !== 3 && node.textContent!.trim().length) {
			text += 1;
		}
	});
	return text;
};

//TODO: maybe we can store the text content directly
export function createSerializableElement(element: HTMLElement, index: number): DomTree {
	const root = element.getAttribute(Attributes.root) ?? "";
	const easings = element.getAttribute(Attributes.rootEasing) ?? "";
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
		key: getKey(element, index),
		root,
		easings,
		children: Array.from(element.children).map((element, index) =>
			createSerializableElement(element as HTMLElement, index)
		),
	};
}
