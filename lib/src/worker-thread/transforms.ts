import {
	DomRepresentation,
	TreeRepresentation,
	DomElement,
	Display,
	ObjectFit,
	Position,
	TreeElement,
} from "../types";

const parseStringValues = (value: string, dimensions: [number, number]) =>
	value.split(" ").map((value: string, index: number) => {
		if (value.includes("px")) {
			return parseFloat(value);
		}

		return (parseFloat(value) / 100) * dimensions[index];
	});

export const normalizeBorderRadius = (radius: string, [width, height]: [number, number]) => {
	if (radius === "0px" || radius.includes("/")) {
		//TODO: handle complex border-radius
		return "";
	}

	const radii = radius.split(" ");
	const widthEntries: string[] = [];
	const heightEntries: string[] = [];

	if (radii.length === 3) {
		radii.push(radius[1]);
	}

	radii.forEach((value) => {
		if (value.includes("%") || value === "0px") {
			widthEntries.push(value);
			heightEntries.push(value);
			return;
		}
		const parsedValue = parseFloat(value);
		widthEntries.push(`${(100 * parsedValue) / width}%`);
		heightEntries.push(`${(100 * parsedValue) / height}%`);
	});

	return `${widthEntries.join(" ")} / ${heightEntries.join(" ")}`;
};

export const transformDomRepresentation = (dom: DomRepresentation): TreeRepresentation => {
	const current = dom[0] as DomElement;
	const children = dom[1] as DomRepresentation[];

	const dimensions: [number, number] = [current.currentWidth, current.currentHeight];

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
			objectPosition: parseStringValues(current.objectPosition ?? "50% 50%", dimensions),
			position: current.position ?? Position.static,
			ratio: current.ratio ?? 0,
			text: current.text ?? 0,
			transformOrigin: parseStringValues(current.transformOrigin ?? "0px 0px", dimensions),
		} as TreeElement,
		children.map(transformDomRepresentation),
	];
};
