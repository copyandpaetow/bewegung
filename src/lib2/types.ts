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
		offset: number[];
		class: string[];
		attribute: string[];
	}
>;

export type NonCSSEntries = {
	class: string;
	attribute: string;
	offset: number;
	easing: string;
	composite: string;
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
};

export type DifferenceArray = [ElementReadouts, ElementReadouts];

export type PartialDomRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

export type StyleChangePossibilities = {
	style?: Partial<CSSStyleDeclaration>;
	classes?: Set<string>;
	attributes?: Set<string>;
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

export interface Result {
	animations: Animation[];
	onStart: VoidFunction[];
}

export type EntryType = "image" | "text" | "default";

export type ElementEntry = {
	affectedBy: string[];
	parent: string;
	root: string;
	type: EntryType;
	ratio: number;
};

export interface WorkerMethods {
	postMessage: (message: any) => void;
	terminate: () => void;
	addListener: (name: any, listener: any) => void;
	removeListener: (name: any) => void;
	sendQuery: (queryMethod: any, ...queryMethodArguments: any[]) => void;
}

export interface State {
	selectors: Map<string, number>;
	elementLookup: BidirectionalMap<string, HTMLElement>;
	rootSelector: Map<HTMLElement, string[]>;
	cssResets: Map<HTMLElement, Map<string, string>>;
	worker: WorkerMethods;
}

export interface WorkerState {
	keyframes: Map<string, CustomKeyframe[]>;
	options: Map<string, BewegungsOptions[]>;
	totalRuntime: number;
	changeTimings: number[];
	appliableKeyframes: Map<string, CustomKeyframe>[];
	resultingStyleChange: Map<string, CustomKeyframe>;
	readouts: Map<string, ElementReadouts[]>;
	lookup: Map<string, ElementEntry>;
	rootElements: Set<string>;
}

export interface ImageState {
	wrapperStyle: Partial<CSSStyleDeclaration>;
	placeholderStyle: Partial<CSSStyleDeclaration>;
	ratio: number;
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
		before: CustomKeyframe;
		after: CustomKeyframe;
	};
}

export type TransferObject = {
	targets: string[][];
	keyframes: EveryKeyframeSyntax[];
	options: EveryOptionSyntax[];
};

export type AnimationInformation = {
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: CssRuleName[];
};
