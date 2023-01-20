import { CssRuleName, CustomKeyframe, ElementReadouts, MainState } from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./read-dom-properties";

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const readDom = async (
	elementChanges: Map<string, CustomKeyframe>,
	changeProperties: CssRuleName[],
	state: MainState
) => {
	const { resets, translation } = state;
	const readouts = new Map<string, ElementReadouts>();
	const offset = elementChanges.values().next().value.offset;

	await nextBrowserRender();
	elementChanges.forEach((styleChange, elementString) => {
		const domElement = translation.get(elementString)!;
		applyCSSStyles(domElement, styleChange);
	});
	translation.forEach((domElement, elementString) => {
		readouts.set(elementString, getCalculations(domElement, changeProperties, offset));
	});
	resets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};
