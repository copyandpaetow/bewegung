import { StructureOfChunks, ComputedState, Calculations, Overrides, Readouts } from "../types";

export const makeState = (): StructureOfChunks =>
	Object.freeze({
		elements: [],
		keyframes: [],
		callbacks: [],
		options: [],
		selectors: [],
	});

export const makeComputedState = (): ComputedState =>
	Object.freeze({
		cssStyleReset: [],
		secondaryElements: [],
	});

export const makeCaluclations = (): Calculations =>
	Object.freeze({
		primary: [],
		secondary: [],
	});

export const makeReadouts = (): Readouts =>
	Object.freeze({
		primary: [],
		secondary: [],
	});

export const makeOverrides = (): Overrides =>
	Object.freeze({
		primary: [],
		secondary: [],
	});
