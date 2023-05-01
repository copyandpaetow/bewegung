import { DomTree } from "./types";

export function createSerializableElement(element: HTMLElement, index: number): DomTree {
	const { top, left, width, height } = element.getBoundingClientRect();
	const { display, borderRadius, position, transform, transformOrigin, objectFit, objectPosition } =
		window.getComputedStyle(element);

	const children: HTMLElement[] = [];
	let text = 0;

	element.childNodes.forEach((node) => {
		if (node.nodeType === 3) {
			text = text + node.textContent!.trim().length;
		}
		if (node.nodeType === 1) {
			children.push(node as HTMLElement);
		}
	});

	//@ts-expect-error
	const ratio = (element.naturalWidth ?? 1) / (element.naturalHeight ?? -1);

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
		key: element.getAttribute("bewegung-key") ?? `key-${element.tagName}-${index}`,
		root: element.getAttribute("bewegungs-root") ?? "",
		children: children.map(createSerializableElement),
	};
}
