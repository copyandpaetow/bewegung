import { scheduleCallback } from "../scheduler";
import { AnimationEntry, State, ValueOf } from "../types";

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
			const needsNestedArray = type === "keyframes" || type === "callbacks";
			const value = entry[type] as Value;

			const existingValues = (state.get(mainElement) ?? [])?.concat(
				needsNestedArray ? [value] : value
			);

			state.set(mainElement, existingValues);
		});
	});
};

export const setState = (state: State, animationEntries: AnimationEntry[]) => {
	const tasks = [
		() => fillMainElements(state.mainElements, animationEntries),
		() => fillState(state.keyframes, "keyframes", animationEntries),
		() => fillState(state.callbacks, "callbacks", animationEntries),
		() => fillState(state.options, "options", animationEntries),
		() => fillState(state.selectors, "selector", animationEntries),
		() => fillResets(state.cssStyleReset, state.mainElements),
	];

	tasks.forEach(scheduleCallback);
};
