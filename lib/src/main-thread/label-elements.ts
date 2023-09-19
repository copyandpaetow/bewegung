import { Display, DomElement, DomRepresentation, ObjectFit, Position } from "../types";
import { uuid } from "../utils/helper";
import { isDomEntryVisible } from "../utils/predicates";

const hasTextAttribute = (element: HTMLElement) => {
	let hasText = false;
	const children = element.childNodes;

	for (let index = 0; index < children.length; index++) {
		const node = children[index];
		if (node.nodeType !== 3) {
			continue;
		}
		if (node.textContent!.trim().length) {
			hasText = true;
			break;
		}
	}

	return hasText;
};

const getMediaRatioAttribute = (element: HTMLImageElement) => {
	return element.naturalWidth / element.naturalHeight;
};

const readElement = (element: HTMLElement, offset: number): DomElement => {
	const dimensions = element.getBoundingClientRect();
	const style = window.getComputedStyle(element);
	const key = (element.dataset.bewegungsKey ??= uuid(element.tagName));

	const result: DomElement = {
		key,
		offset,
		windowHeight: window.innerHeight,
		windowWidth: window.innerWidth,
		currentLeft: dimensions.left,
		currentTop: dimensions.top,
		currentWidth: dimensions.width,
		currentHeight: dimensions.height,
	};

	if (style.getPropertyValue("display") === "none") {
		result.display = Display.none;
		return result;
	}

	if (style.getPropertyValue("position") !== "static") {
		result.position = Position.relative;
	}

	if (style.getPropertyValue("border-radius") !== "0px") {
		result.borderRadius = style.getPropertyValue("border-radius");
	}

	if (style.getPropertyValue("object-fit") === "cover") {
		result.objectFit = ObjectFit.cover;
	}

	if (style.getPropertyValue("object-position") !== "50% 50%") {
		result.objectPosition = style.getPropertyValue("object-position");
	}

	if (style.getPropertyValue("transform") !== "none") {
		result.transform = style.getPropertyValue("transform");
	}

	if (style.getPropertyValue("transform-origin") !== "50% 50%") {
		result.transformOrigin = style.getPropertyValue("transform-origin");
	}

	if (hasTextAttribute(element)) {
		result.text = 1;
	}
	if (element.hasOwnProperty("naturalWidth")) {
		result.ratio = getMediaRatioAttribute(element as HTMLImageElement);
	}

	return result;
};

export const recordElement = (element: HTMLElement, offset: number): DomRepresentation => {
	const entry = readElement(element, offset);
	const representation: DomRepresentation = [];
	const children = element.children;

	if (isDomEntryVisible(entry)) {
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
