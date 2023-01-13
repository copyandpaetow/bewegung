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
	const { elementResets, elementTranslation } = state;
	const readouts = new Map<string, ElementReadouts>();
	let offset;

	await nextBrowserRender();
	elementChanges.forEach((styleChange, elementString) => {
		const domElement = elementTranslation.get(elementString)!;
		applyCSSStyles(domElement, styleChange);
		if (offset === undefined) {
			offset = styleChange.offset;
		}
	});
	elementTranslation.forEach((domElement, elementString) => {
		readouts.set(elementString, getCalculations(domElement, changeProperties, offset));
	});
	elementResets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};
