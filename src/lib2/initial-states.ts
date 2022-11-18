import { defaultOptions } from "./constants";
import {
	State,
	CustomKeyframe,
	Callbacks,
	BewegungsOptions,
	WatchState,
	AnimationState,
	ElementReadouts,
	DomState,
	StyleChangePossibilities,
} from "./types";

const callbackAnimation = new Animation(
	new KeyframeEffect(document.createElement("div"), null, defaultOptions.duration as number)
);

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
	animations: new Map<HTMLElement, Animation>(),
	timeKeeper: new Animation(
		new KeyframeEffect(document.createElement("div"), null, defaultOptions.duration as number)
	),
	onStart: new WeakMap<HTMLElement, VoidFunction[]>(),
	onEnd: new WeakMap<HTMLElement, VoidFunction[]>(),
});

export const initialWatchState = (): WatchState => ({
	IO: new WeakMap<HTMLElement, IntersectionObserver>(),
	RO: new WeakMap<HTMLElement, ResizeObserver>(),
	MO: undefined,
});

export const initialAnimationState = (): AnimationState => ({
	readouts: new Map<HTMLElement, ElementReadouts[]>(),
	imageReadouts: new Map<HTMLImageElement, ElementReadouts[]>(),
});

export const initialDomState = (): DomState => ({
	timings: [],
	properties: [],
	keyframeMap: new Map<number, Map<HTMLElement, StyleChangePossibilities>>(),
});
