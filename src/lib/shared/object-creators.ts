import {
	BewegungsOptions,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	GeneralState,
	MainElementState,
	MainState,
} from "../types";
import { defaultOptions } from "./constants";
import { BidirectionalMap } from "./element-translations";

export const getEmptyResults = () =>
	Promise.resolve({
		animations: new Map(),
		onStart: [() => {}],
		timeKeeper: new Animation(null, null),
		totalRuntime: defaultOptions.duration as number,
		...initMainState(),
	});

export const initMainState = (): MainState => ({
	root: new Map<HTMLElement, HTMLElement>(),
	resets: new Map<HTMLElement, Map<string, string>>(),
	translation: new BidirectionalMap<string, HTMLElement>(),
});

export const initGeneralState = (): GeneralState => ({
	affectedBy: new Map<string, string[]>(),
	parent: new Map<string, string>(),
	root: new Map<string, string>(),
	type: new Map<string, EntryType>(),
	ratio: new Map<string, number>(),
});

export const initMainElementState = (): MainElementState => ({
	options: new Map<string, BewegungsOptions[]>(),
	totalRuntime: 0,
	changeTimings: [0, 1],
	changeProperties: new Set<CssRuleName>(),
	appliableKeyframes: new Map<number, Map<string, CustomKeyframe>>(),
	readouts: new Map<string, ElementReadouts[]>(),
});
