import { AppliableKeyframes, ElementReadouts, MainState } from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./read-dom-properties";

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const readDom = async (appliableKeyframes: AppliableKeyframes, state: MainState) => {
	const { resets, translation } = state;
	const { keyframes, changeProperties } = appliableKeyframes;
	const readouts = new Map<string, ElementReadouts>();

	const offset = keyframes.values().next().value.offset;

	await nextBrowserRender();
	keyframes.forEach((styleChange, elementID) => {
		const domElement = translation.get(elementID)!;
		applyCSSStyles(domElement, styleChange);
	});
	translation.forEach((domElement, elementID) => {
		readouts.set(elementID, getCalculations(domElement, changeProperties, offset));
	});
	resets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};
