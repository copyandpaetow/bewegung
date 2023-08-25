import { NormalizedOptions } from "../types";

export const defaultOptions: Omit<NormalizedOptions, "root"> & { root: string } = {
	duration: 400,
	easing: "ease",
	root: "body",
	delay: 0,
	endDelay: 0,
	from: () => {},
	to: () => {},
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
