import { CssRuleName, PartialDomRect } from "./types";

export const emptyNonZeroDOMRect: PartialDomRect = {
	width: 1,
	height: 1,
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
};

export const defaultChangeProperties: CssRuleName[] = [
	"borderRadius",
	"display",
	"font",
	"opacity",
	"filter",
	"position",
	"transform",
	"transformOrigin",
	"width",
	"height",
	"objectFit",
	"objectPosition",
];

export const defaultOptions: Partial<KeyframeEffectOptions> = {
	delay: 0,
	direction: "normal",
	duration: "400",
	easing: "ease",
	endDelay: 0,
	fill: "auto",
	iterationStart: 0,
	iterations: 1,
};

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
