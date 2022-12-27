import { type } from "os";
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

export interface State {
	selectors: Map<string, number[]>;
	elementLookup: BidirectionalMap<string, HTMLElement>;
	rootSelector: Map<HTMLElement, string[]>;
	cssResets: Map<HTMLElement, Map<string, string>>;
}

export type Selector = {
	keyframes: CustomKeyframe[];
	options: BewegungsOptions;
};

export interface WorkerState {
	keyframes: Map<string, CustomKeyframe[]>;
	options: Map<string, BewegungsOptions[]>;
	selectors: Map<string, Selector[]>;
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: CssRuleName[];
	appliableKeyframes: Map<string, CustomKeyframe>[];
	remainingKeyframes: number;
	readouts: Map<string, ElementReadouts[]>;
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
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

export type MainTransferObject = {
	_keys: string[][];
	keyframes: EveryKeyframeSyntax[];
	options: EveryOptionSyntax[];
	selectors: string[];
};

export type GeneralTransferObject = {
	_keys: string[];
	root: string[];
	parent: string[];
	type: EntryType[];
	affectedBy: string[][];
	ratio: number[];
};

export type ReadoutTransferObject = {
	[entry in keyof ElementReadouts]: ValueOf<ElementReadouts>;
} & {
	_keys: string[];
};

export type AnimationInformation = {
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: CssRuleName[];
};

export type ExpandEntry = {
	(allTargets: string[][], entry: CustomKeyframe[][]): Map<string, CustomKeyframe[]>;
	(allTargets: string[][], entry: BewegungsOptions[]): Map<string, BewegungsOptions[]>;
	(allTargets: string[][], entry: [CustomKeyframe[][], BewegungsOptions[]]): Map<
		string,
		Selector[]
	>;
};

export type WorkerActions<State> = {
	updateMainState(context: Context<State>, paylaod: MainTransferObject): void;
	updateRemainingKeyframes(context: Context<State>): void;
	updateReadouts(context: Context<State>, payload: ReadoutTransferObject): void;
	replyConstructedKeyframes(context: Context<State>): void;
	replyAppliableKeyframes(context: Context<State>): void;
};

export type WorkerMethods<State> = {
	setMainState(context: Context<State>, transferObject: MainTransferObject): void;
	decreaseRemainingKeyframes(context: Context<State>): void;
	setReadouts(context: Context<State>, transferObject: ReadoutTransferObject): void;
	setGeneralState(context: Context<State>, transferObject: GeneralTransferObject): void;
};

export type WorkerSchema = {
	state: WorkerState;
	methods: WorkerMethods<WorkerState>;
	actions: WorkerActions<WorkerState>;
};

export type Context<State> = {
	state: State;
	commit(method: any, payload?: any): void;
	dispatch(action: any, payload?: any): void;
	reply(queryMethodListener: any, queryMethodArguments: any): void;
};
