import {
	DomRepresentation,
	TreeRepresentation,
	DomElement,
	Display,
	ObjectFit,
	Position,
	TreeElement,
} from "../types";

export const transformDomRepresentation = (dom: DomRepresentation): TreeRepresentation => {
	const current = dom[0] as DomElement;
	const children = dom[1] as DomRepresentation[];

	//TODO: we can try to turn as many of them into numbers as possible with either parsing or enums
	return [
		{
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
			objectPosition: current.objectPosition ?? "50% 50%",
			position: current.position ?? Position.static,
			ratio: current.ratio ?? 0,
			text: current.text ?? 0,
			transform: current.transform ?? "",
			transformOrigin: current.transformOrigin ?? "0px 0px",
		} as TreeElement,
		children.map(transformDomRepresentation),
	];
};
