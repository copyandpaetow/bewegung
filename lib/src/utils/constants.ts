import { BewegungsOption } from "../types";

export const defaultOptions: Required<BewegungsOption> & {
	from: VoidFunction | undefined;
	to: VoidFunction | undefined;
} = {
	duration: 400,
	easing: "ease",
	root: document.body,
	delay: 0,
	endDelay: 0,
	from: undefined,
	to: undefined,
	at: 0,
};

export const emptyImageSrc =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

//TODO: do we use all of these
export const enum Attributes {
	key = "data-bewegungs-key",
	reset = "data-bewegungs-reset",
	removable = "data-bewegungs-removable",
	cssReset = "data-bewegungs-css-reset",
	replace = "data-bewegungs-replace",
}

//TODO:remove later if debugging is not needed anymore
export const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
