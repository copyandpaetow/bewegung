import { Bewegung } from "../bewegung";
import { BewegungsOption } from "../types";

export const defaultOptions: Required<BewegungsOption> = {
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
	removable = "data-bewegungs-removable",
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

export const emptyApi = (): Bewegung => ({
	play() {
		console.warn("the user prefers reduced motion");
	},
	prefetch() {
		return Promise.resolve();
	},
	pause() {
		console.warn("the user prefers reduced motion");
	},
	scroll(scrollAmount: number, done = false) {
		console.warn("the user prefers reduced motion", { scrollAmount, done });
	},
	cancel() {
		console.warn("the user prefers reduced motion");
	},
	finish() {
		console.warn("the user prefers reduced motion");
	},
	get finished() {
		return Promise.resolve(new Animation());
	},
	get playState() {
		return "finished" as AnimationPlayState;
	},
});
