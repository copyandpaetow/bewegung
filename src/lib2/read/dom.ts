import { applyCSSStyles } from "../apply-styles";
import { restoreOriginalStyle } from "../normalize/css-resets";
import { ElementReadouts, State, StyleChangePossibilities, WorkerMethods } from "../types";
import { getCalculations } from "./dom-properties";

export const readDom = (elementChanges: Map<string, StyleChangePossibilities>, state: State) => {
	const { cssResets, elementLookup, changeProperties } = state;
	const readouts = new Map<string, ElementReadouts>();

	elementChanges.forEach((styleChange, elementString) => {
		const domElement = state.elementLookup.get(elementString)!;
		applyCSSStyles(domElement, styleChange);
		elementLookup.forEach((domElement, elementString) => {
			readouts.set(
				elementString,
				getCalculations(domElement, changeProperties, styleChange.offset)
			);
		});
		cssResets.forEach((reset, elementString) => {
			const domElement = state.elementLookup.get(elementString)!;
			restoreOriginalStyle(domElement, reset);
		});
	});
	return readouts;
};
