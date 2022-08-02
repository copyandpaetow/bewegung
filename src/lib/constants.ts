import { cssRuleName } from "./types";

export const emptyNonZeroDOMRect: DOMRect = {
	width: 1,
	height: 1,
	x: 0,
	y: 0,
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	toJSON: () => undefined,
};

export const defaultChangeProperties: cssRuleName[] = [
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
];

export const defaultOptions: Partial<KeyframeEffectOptions> = {
	duration: 400,
	easing: "ease",
};
