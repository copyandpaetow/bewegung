import { BidirectionalMap } from "./utils";

export type ElementOrSelector =
	| HTMLElement
	| Element
	| HTMLElement[]
	| Element[]
	| NodeListOf<Element>
	| HTMLCollection
	| string;

export type ValueOf<T> = T[keyof T];

export type CssRuleName = "cssOffset" | keyof CSSStyleDeclaration;

export type CustomKeyframeArrayValueSyntax = Partial<
	Record<CssRuleName, string[] | number[]> & {
		callback: VoidFunction[];
		offset: number[];
		class: string[];
		attribute: string[];
	}
>;

export type NonCSSEntries = {
	class: string;
	attribute: string;
	callback: VoidFunction;
	offset: number;
};

export type CustomKeyframe = Partial<Record<CssRuleName, string | number> & NonCSSEntries>;

export type EveryKeyframeSyntax =
	| CustomKeyframe
	| CustomKeyframe[]
	| CustomKeyframeArrayValueSyntax;

export interface BewegungsOptions extends KeyframeEffectOptions, ComputedEffectTiming {
	rootSelector?: string;
}

export type EveryOptionSyntax = number | BewegungsOptions | undefined;

export type CustomKeyframeEffect = [
	target: ElementOrSelector,
	keyframes: EveryKeyframeSyntax,
	options: EveryOptionSyntax
];

export type Callbacks = {
	callback: VoidFunction;
	offset: number;
};

export interface BewegungAPI {
	play: () => void;
	pause: () => void;
	scroll: (progress: number, done?: boolean) => void;
	reverse: () => void;
	cancel: () => void;
	commitStyles: () => void;
	finish: () => void;
	updatePlaybackRate: (newPlaybackRate: number) => void;
	readonly finished: Promise<void>;
	readonly playState: AnimationPlayState;
}

export type BewegungProps = CustomKeyframeEffect | (CustomKeyframeEffect | KeyframeEffect)[];

export type ElementReadouts = {
	dimensions: PartialDomRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
	ratio: number;
};

export type DifferenceArray = [ElementReadouts, ElementReadouts];

export type PartialDomRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

export type StyleChangePossibilities = {
	style: Partial<CSSStyleDeclaration>;
	classes: string[];
	attributes: string[];
	offset: number;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}
export type Timeline = TimelineEntry[];

export type AnimationEntry = {
	target: HTMLElement[];
	keyframes: CustomKeyframe[];
	callbacks: Callbacks[];
	options: BewegungsOptions;
	selector: string;
};

export interface Result {}

export type EntryType = "image" | "text" | "default";

export type ElementEntry = {
	parent: string;
	root: string;
	type: EntryType;
	chunks: string[];
};

export interface WorkerMethods {
	postMessage: (message: any) => void;
	terminate: () => void;
	addListener: (name: any, listener: any) => void;
	removeListener: (name: any) => void;
	sendQuery: (queryMethod: any, ...queryMethodArguments: any[]) => void;
}

export interface State {
	callbacks: Map<string, Callbacks[]>;
	selectors: Map<string, string>;
	elementLookup: BidirectionalMap<string, HTMLElement>;
	mainElements: Map<string, string[]>;
	options: Map<string, BewegungsOptions>;
	cssResets: Map<string, Map<string, string>>;
	changeProperties: CssRuleName[];
}

export interface WorkerState {
	keyframes: Map<string, CustomKeyframe[]>;
	options: Map<string, BewegungsOptions>;
	elements: Map<string, string[]>;
	changeTimings: number[];
	totalRuntime: number;
	appliableKeyframes: Map<string, StyleChangePossibilities>[];
	readouts: Map<string, ElementReadouts[]>;
	lookup: Map<string, ElementEntry>;
	sendKeyframes: number;
	recievedKeyframes: number;
}

export interface ImageState {
	wrapperStyle: Partial<CSSStyleDeclaration>;
	placeholderStyle: Partial<CSSStyleDeclaration>;
	maxWidth: number;
	maxHeight: number;
	easingTable: Record<number, string>;
	wrapperKeyframes: Keyframe[];
	keyframes: Keyframe[];
	overrides: { before: Partial<CSSStyleDeclaration>; after: Partial<CSSStyleDeclaration> };
}

export interface StyleTables {
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
	easingTable: Record<number, string>;
}

export interface DefaultKeyframes {
	keyframes: Keyframe[];
	overrides: {
		before: Partial<CSSStyleDeclaration>;
		after: Partial<CSSStyleDeclaration>;
	};
}
