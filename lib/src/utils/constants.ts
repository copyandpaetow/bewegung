import { BewegungsOption } from "../types";

export const defaultOptions: Required<BewegungsOption> = {
	duration: 400,
	easing: "ease",
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
	root = "data-bewegungs-root",
}
