import { CssRuleName } from "../types";

export const defaultChangeProperties: CssRuleName[] = [
	"borderRadius",
	"display",
	"filter",
	"objectFit",
	"objectPosition",
	"opacity",
	"position",
	"transform",
	"transformOrigin",
];

export const defaultOptions: Partial<KeyframeEffectOptions> = {
	composite: "replace",
	delay: 0,
	direction: "normal",
	duration: "400",
	easing: "ease",
	endDelay: 0,
	fill: "auto",
	iterations: 1,
	iterationStart: 0,
};

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export const defaultImageStyles: Partial<CSSStyleDeclaration> = {
	aspectRatio: "initial",
	display: "initial",
	imageOrientation: "initial",
	imageRendering: "initial",
	inset: "initial",
	height: "initial",
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
	width: "initial",
};
