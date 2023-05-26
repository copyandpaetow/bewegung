import { CssRuleName } from "./types";

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
	duration: 400,
	easing: "ease",
};

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
