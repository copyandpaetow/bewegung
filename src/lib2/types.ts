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

export type ElementReadouts = Omit<Partial<CSSStyleDeclaration>, "offset"> & {
	currentTop: number;
	currentLeft: number;
	unsaveWidth: number;
	unsaveHeight: number;
	currentWidth: number;
	currentHeight: number;
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
	self: string;
};

export type QueryFunctions = {
	initWorkerState(transferObject: TransferObject): void;
	sendElementLookup(elementLookup: Map<string, ElementEntry>): void;
	requestAppliableKeyframes(): void;
	sendReadouts(newReadout: Map<string, ElementReadouts>): void;
};

export type Queries = {
	initWorkerState: [TransferObject];
	sendElementLookup: [Map<string, ElementEntry>];
	requestAppliableKeyframes: [];
	sendReadouts: [Map<string, ElementReadouts>];
};

export type Replies = {
	sendAppliableKeyframes: [
		{ keyframes: Map<string, CustomKeyframe>; changeProperties: CssRuleName[]; done: boolean }
	];
	sendKeyframeInformationToClient: [AnimationInformation];
	sendKeyframes: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]];
};

export type ReplyFunctions = {
	sendAppliableKeyframes: (
		returnValue: [
			{ keyframes: Map<string, CustomKeyframe>; changeProperties: CssRuleName[]; done: boolean }
		]
	) => void;
	sendKeyframeInformationToClient: (returnValue: [AnimationInformation]) => void;
	sendKeyframes: (
		returnValue: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]]
	) => void;
};

export interface WorkerMethods {
	terminate: () => void;
	addListener: (name: keyof ReplyFunctions, listener: ValueOf<ReplyFunctions>) => void;
	removeListener: (name: keyof ReplyFunctions) => void;
	sendQuery: (queryMethod: keyof Queries, ...queryMethodArguments: ValueOf<Queries>) => void;
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
	changeProperties: CssRuleName[];
	appliableKeyframes: Map<string, CustomKeyframe>[];
	remainingKeyframes: number;
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
	override: Partial<CSSStyleDeclaration>;
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
	resultingStyle: CustomKeyframe;
	override: CustomKeyframe;
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

export type ExpandEntry = {
	(allTargets: string[][], entry: CustomKeyframe[][]): Map<string, CustomKeyframe[]>;
	(allTargets: string[][], entry: BewegungsOptions[]): Map<string, BewegungsOptions[]>;
};
