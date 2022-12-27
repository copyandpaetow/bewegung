import {
	AnimationInformation,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
	State,
} from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./read-dom-properties";

export const getAnimationInformation = (state: State) =>
	new Promise<AnimationInformation>((resolve) => {
		state.worker.addListener(
			"sendKeyframeInformationToClient",
			([information]: [AnimationInformation]) => {
				resolve(information);
			}
		);
	});

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const readDom = async (
	elementChanges: Map<string, CustomKeyframe>,
	changeProperties: CssRuleName[],
	state: State
) => {
	const { cssResets, elementTranslation } = state;
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
	cssResets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};
