import { scheduleCallback } from "../scheduler";
import { MainType } from "../types";

const saveOriginalStyle = (element: HTMLElement) => {
	const allAttributes = new Map<string, string>([["style", ""]]);
	element.getAttributeNames().forEach((attribute) => {
		allAttributes.set(attribute, element.getAttribute(attribute)!);
	});

	return allAttributes;
};

export const fillResets = (cssStyleReset: Map<string, string>[][], mainElements: MainType) => {
	mainElements.forEach((row, index) => {
		cssStyleReset[index] = row.map((element) => saveOriginalStyle(element));
	});
};
