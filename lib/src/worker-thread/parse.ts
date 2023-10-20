import {
	Display,
	DomElement,
	DomRepresentation,
	ObjectFit,
	Position,
	TreeElement,
	TreeRepresentation,
} from "../types";
import { isEntryVisible } from "../utils/helper";

const parseStringValues = (value: string, dimensions: [number, number]) =>
	value.split(" ").map((value: string, index: number) => {
		if (value.includes("px")) {
			return parseFloat(value);
		}

		return (parseFloat(value) / 100) * dimensions[index];
	});

const isElementInViewport = (entry: DomElement) =>
	entry.currentTop + entry.currentHeight > 0 &&
	entry.currentTop < entry.windowHeight &&
	entry.currentLeft + entry.currentWidth > 0 &&
	entry.currentLeft < entry.windowWidth;

export const parseDomRepresentation = (
	dom: DomRepresentation,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
): TreeRepresentation => {
	const current = dom[0] as DomElement;
	const children = dom[1] as DomRepresentation[];

	const dimensions: [number, number] = [current.currentWidth, current.currentHeight];

	const result = {
		currentHeight: current.currentHeight,
		currentLeft: current.currentLeft,
		currentTop: current.currentTop,
		currentWidth: current.currentWidth,
		key: current.key,
		offset: current.offset,
		unsaveHeight: current.currentHeight,
		unsaveWidth: current.currentWidth,
		windowHeight: current.windowHeight,
		windowWidth: current.windowWidth,
		borderRadius: current.borderRadius ?? "0px",
		display: current.display ?? Display.visible,
		objectFit: current.objectFit ?? ObjectFit.fill,
		objectPosition: parseStringValues(current.objectPosition ?? "50% 50%", dimensions), //TODO: this only needs to happen when there is a value
		position: current.position ?? Position.static,
		ratio: current.ratio ?? 0,
		text: current.text ?? 0,
		transformOrigin: parseStringValues(current.transformOrigin ?? "0px 0px", dimensions),
		visibility: isElementInViewport(current),
	} as TreeElement;

	if (overrideStore.has(current.key)) {
		Object.entries(overrideStore.get(current.key)!).forEach(([key, value]) => {
			result[key] = value;
		});
	}

	if (isEntryVisible(result)) {
		return [result, children.map((dom) => parseDomRepresentation(dom, overrideStore))];
	}

	return [result, []];
};
