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
	AnimationEntry,
	ImageState,
} from "./types";

export const initialPropState = (): AnimationEntry => ({
	target: [],
	keyframes: [],
	callbacks: [],
	selector: "",
	options: { rootSelector: "" },
});

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

export const initialImageState = (element: HTMLImageElement): ImageState => ({
	element,
	originalStyle: element.style.cssText,
	parent: element.parentElement!,
	sibling: element.nextElementSibling,
	ratio: element.naturalWidth / element.naturalHeight,
	wrapper: element,
	placeholder: element,
	maxWidth: 0,
	maxHeight: 0,
	easingTable: {},
	wrapperKeyframes: [],
	keyframes: [],
});
