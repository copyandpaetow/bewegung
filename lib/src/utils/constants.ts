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

export const enum Attributes {
	key = "data-bewegungs-key",
	reset = "data-bewegungs-reset",
	removable = "data-bewegungs-removable",
	cssReset = "data-bewegungs-css-reset",
}
