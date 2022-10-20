import { defaultOptions } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	AnimationEntry,
	BewegungsOptions,
	Callbacks,
	CustomKeyframe,
	State,
	ValueOf,
} from "../types";
import { computeSecondaryProperties } from "./affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./offsets";
import { calculateTotalRuntime } from "./runtime";

export const initialState = (): State => ({
	mainElements: new Set<HTMLElement>(),
	secondaryElements: new Set<HTMLElement>(),
	keyframes: new WeakMap<HTMLElement, CustomKeyframe[][]>(),
	callbacks: new WeakMap<HTMLElement, Callbacks[][]>(),
	options: new WeakMap<HTMLElement, BewegungsOptions[]>(),
	selectors: new WeakMap<HTMLElement, string[]>(),
	totalRuntime: defaultOptions.duration as number,
	rootElement: new WeakMap<HTMLElement, HTMLElement>(),
	cssStyleReset: new WeakMap<HTMLElement, Map<string, string>>(),
});

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

export const setState = (state: State, animationEntries: AnimationEntry[]) => {
	const tasks = [
		() => fillMainElements(state.mainElements, animationEntries),
		() => fillState(state.keyframes, "keyframes", animationEntries),
		() => fillState(state.callbacks, "callbacks", animationEntries),
		() => fillState(state.options, "options", animationEntries),
		() => fillState(state.selectors, "selector", animationEntries),
		() => fillResets(state.cssStyleReset, state.mainElements),
		() => computeSecondaryProperties(state),
		() => calculateTotalRuntime(state),
		() => updateKeyframeOffsets(state),
		() => updateCallbackOffsets(state),
	];

	tasks.forEach(scheduleCallback);
};
