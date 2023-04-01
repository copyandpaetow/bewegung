import { BewegungsConfig } from "./types";

export const defaultOptions: BewegungsConfig = {
	duration: 400,
	easing: "ease",
	iterations: 1,
	root: document.body,
	at: 0,
};

export const defaultChangeProperties = {
	borderRadius: "border-radius",
	display: "display",
	filter: "filter",
	objectFit: "object-fit",
	objectPosition: "object-position",
	opacity: "opacity",
	position: "position",
	transform: "transform",
	transformOrigin: "transform-origin",
};
