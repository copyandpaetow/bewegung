import { BewegungsOption } from "../types";

export const defaultOptions: BewegungsOption = {
	duration: 400,
	easing: "ease",
	iterations: 1,
	root: "body",
	at: 0,
};

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export const enum Attributes {
	key = "data-bewegungs-key",
	reset = "data-bewegungs-reset",
	rootEasing = "data-bewegungs-easing",
}

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

export const emptyBoundClientRect = {
	currentTop: 0,
	currentLeft: 0,
	currentWidth: 1,
	currentHeight: 1,
	unsaveWidth: 1,
	unsaveHeight: 1,
};

export const emptyComputedStle = {
	display: "block",
	borderRadius: "0px",
	position: "static",
	transform: "none",
	transformOrigin: "0px 0px",
	objectFit: "fill",
	objectPosition: "50% 50%",
};
