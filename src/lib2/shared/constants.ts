import { CssRuleName, CustomKeyframe } from "../types";

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

export const BEWEGUNG_DATA_ATTRIBUTE = "data-bewegung";
export const BEWEGUNG_PLACEHOLDER = "placeholder";
export const BEWEGUNG_WRAPPER = "wrapper";

export const defaultImageStyles: CustomKeyframe = {
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

export const stateDefinition = {
	idle: {
		running: "running",
		finished: "finished",
		scrolling: "scrolling",
		reversing: "reversing",
	},
	running: {
		paused: "paused",
		reversing: "reversing",
	},
	paused: {
		running: "running",
		scrolling: "scrolling",
		reversing: "reversing",
	},
	scrolling: {
		paused: "paused",
		running: "running",
		reversing: "reversing",
	},
	reversing: {
		paused: "paused",
		running: "running",
	},
	finished: {},
};
