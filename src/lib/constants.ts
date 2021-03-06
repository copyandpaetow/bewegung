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

export const rootClass = `bewegung-stop-traversing${(
	Math.random() * 1000
).toFixed(0)}`;

export const rootElement = (document.querySelector(`.${rootClass}`)
	?.parentElement ?? document.body) as HTMLElement;

export const defaultChangeProperties: cssRuleName[] = [
	"borderRadius",
	"display",
	"font",
	"opacity",
	"position",
	"transform",
	"transformOrigin",
	"width",
];

export const defaultOptions: Partial<KeyframeEffectOptions> = {
	duration: 400,
	easing: "ease",
};
