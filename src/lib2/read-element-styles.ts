import { Attributes, DomTree } from "./types";

export function createSerializableElement(
	element: HTMLElement,
	index: number,
	keyMap: WeakMap<HTMLElement, string>
): DomTree {
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

	if (!keyMap.has(element)) {
		keyMap.set(element, element.getAttribute(Attributes.key) ?? `key-${element.tagName}-${index}`);
	}

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
		key: keyMap.get(element)!,
		root: element.getAttribute(Attributes.root) ?? "",
		children: children.map((element, index) => createSerializableElement(element, index, keyMap)),
	};
}
