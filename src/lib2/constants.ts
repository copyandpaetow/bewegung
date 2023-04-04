import { BewegungsConfig } from "./types";

export const defaultOptions: BewegungsConfig = {
	duration: 400,
	easing: "ease",
	iterations: 1,
	root: "body",
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

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export const BEWEGUNG_DATA_ATTRIBUTE = "data-bewegung";
export const BEWEGUNG_PLACEHOLDER = "placeholder";
export const BEWEGUNG_WRAPPER = "wrapper";

export const defaultImageStyles: Partial<CSSStyleDeclaration> = {
	aspectRatio: "initial",
	display: "initial",
	imageOrientation: "initial",
	imageRendering: "initial",
	inset: "initial",
	height: "100%",
	maxHeight: "initial",
	maxWidth: "initial",
	minHeight: "initial",
	minWidth: "initial",
	objectFit: "initial",
	objectPosition: "initial",
	overflow: "initial",
	pointerEvents: "none",
	position: "initial",
	willChange: "initial",
	width: "100%",
};
