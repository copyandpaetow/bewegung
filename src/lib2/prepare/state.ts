import { AnimationEntry, ValueOf } from "../types";
import { MainType } from "../types";

const saveOriginalStyle = (element: HTMLElement) => {
	const allAttributes = new Map<string, string>([["style", ""]]);
	element.getAttributeNames().forEach((attribute) => {
		allAttributes.set(attribute, element.getAttribute(attribute)!);
	});

	return allAttributes;
};

export const fillResets = (
	cssStyleReset: WeakMap<HTMLElement, Map<string, string>>,
	mainElements: Set<HTMLElement>
) => {
	mainElements.forEach((element) => cssStyleReset.set(element, saveOriginalStyle(element)));
};

export const fillMainElements = (MainElements: Set<HTMLElement>, props: AnimationEntry[]) => {
	props.flatMap((entry) => entry.target).forEach((element) => MainElements.add(element));
};

export const fillState = <Key extends keyof AnimationEntry, Value extends ValueOf<AnimationEntry>>(
	state: WeakMap<HTMLElement, Value[]>,
	type: Key,
	props: AnimationEntry[]
) => {
	props.forEach((entry) => {
		entry.target.forEach((mainElement) => {
			const value = entry[type] as Value;
			const existingValues = state.get(mainElement)?.concat(value) ?? [value];
			state.set(mainElement, existingValues);
		});
	});
};
