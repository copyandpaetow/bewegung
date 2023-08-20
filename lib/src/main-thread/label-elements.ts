import { DomRepresentation, TreeElement, TreeEntry, TreeMedia } from "../types";
import { uuid } from "../utils/helper";
import { isEntryVisible } from "../utils/predicates";

const getTextAttribute = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType !== 3) {
			return;
		}
		text += node.textContent!.trim().length;
	});

	return text;
};

const getMediaRatioAttribute = (element: HTMLElement) => {
	//@ts-expect-error
	if (!element.naturalWidth || !element.naturalHeight) {
		return 0;
	}
	return (element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight;
};

export const readElement = (element: HTMLElement, offset: number): TreeEntry => {
	const dimensions = element.getBoundingClientRect();
	const style = window.getComputedStyle(element);
	const key = (element.dataset.bewegungsKey ??= uuid(element.tagName));

	if (element.tagName === "IMG" || element.tagName === "VIDEO") {
		return {
			currentLeft: dimensions.left,
			currentTop: dimensions.top,
			currentWidth: dimensions.width,
			currentHeight: dimensions.height,
			unsaveWidth: dimensions.width,
			unsaveHeight: dimensions.height,
			display: style.getPropertyValue("display"),
			borderRadius: style.getPropertyValue("border-radius"),
			position: style.getPropertyValue("position"),
			transform: style.getPropertyValue("transform"),
			transformOrigin: style.getPropertyValue("transform-origin"),
			objectFit: style.getPropertyValue("object-fit"),
			objectPosition: style.getPropertyValue("object-position"),
			ratio: getMediaRatioAttribute(element),
			key,
			offset,
		} as TreeMedia;
	}

	return {
		currentLeft: dimensions.left,
		currentTop: dimensions.top,
		currentWidth: dimensions.width,
		currentHeight: dimensions.height,
		unsaveWidth: dimensions.width,
		unsaveHeight: dimensions.height,
		display: style.getPropertyValue("display"),
		borderRadius: style.getPropertyValue("border-radius"),
		transform: style.getPropertyValue("transform"),
		transformOrigin: style.getPropertyValue("transform-origin"),
		position: style.getPropertyValue("position"),
		text: getTextAttribute(element),
		key,
		offset,
	} as TreeElement;
};

export const recordElement = (element: HTMLElement, offset: number): DomRepresentation => {
	const entry = readElement(element, offset);
	const representation: DomRepresentation = [];
	const children = element.children;

	if (isEntryVisible(entry)) {
		for (let index = 0; index < children.length; index++) {
			const child = children.item(index) as HTMLElement;

			representation.push(recordElement(child, offset));
		}
	}

	return [entry, representation];
};

export const recordDomLabels = (element: HTMLElement) => {
	if (element.dataset.bewegungsKey) {
		return;
	}
	element.dataset.bewegungsKey = uuid(element.tagName);
	const children = element.children;

	for (let index = 0; index < children.length; index++) {
		recordDomLabels(children.item(index) as HTMLElement);
	}
};
