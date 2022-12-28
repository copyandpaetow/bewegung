import { type } from "os";
import { BidirectionalMap } from "./main-thread/element-translations";

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

export type ExpandEntry = {
	(allTargets: string[][], entry: CustomKeyframe[][]): Map<string, CustomKeyframe[]>;
	(allTargets: string[][], entry: BewegungsOptions[]): Map<string, BewegungsOptions[]>;
	(allTargets: string[][], entry: [CustomKeyframe[][], BewegungsOptions[]]): Map<
		string,
		Selector[]
	>;
};

export type WorkerActions = {
	updateMainState(context: Context<WorkerState>, paylaod: MainTransferObject): void;
	updateGeneralState(context: Context<WorkerState>, paylaod: GeneralTransferObject): void;
	updateRemainingKeyframes(context: Context<WorkerState>): void;
	updateReadouts(context: Context<WorkerState>, payload: Map<string, ElementReadouts>): void;
	replyConstructedKeyframes(context: Context<WorkerState>): void;
	replyAppliableKeyframes(context: Context<WorkerState>): void;
};

export type WorkerMethods = {
	setMainState(context: Context<WorkerState>, transferObject: MainTransferObject): void;
	decreaseRemainingKeyframes(context: Context<WorkerState>): void;
	setReadouts(context: Context<WorkerState>, transferObject: Map<string, ElementReadouts>): void;
	setGeneralState(context: Context<WorkerState>, transferObject: GeneralTransferObject): void;
};

export type WorkerSchema = {
	state: WorkerState;
	methods: WorkerMethods;
	actions: WorkerActions;
};

export type MainState = {
	cssResets: Map<HTMLElement, Map<string, string>>;
	rootSelector: Map<HTMLElement, string[]>;
	elementTranslation: BidirectionalMap<string, HTMLElement>;
	generalTransferObject: GeneralTransferObject;
	mainTransferObject: MainTransferObject;
	onStart: VoidFunction[];
	animations: Animation[];
	result: Promise<Result>;
	finishCallback: (value: Result | PromiseLike<Result>) => void;
};

export type MainMethods = {
	setMainTransferObject(context: Context<MainState>, payload: BewegungProps): void;
	setGeneralTransferObject(context: Context<MainState>, payload: any): void;
	setResults(context: Context<MainState>, payload: resultingKeyframes): void;
};
type resultingKeyframes = [Map<string, ImageState>, Map<string, DefaultKeyframes>, number];

type AppliableKeyframes = {
	done: boolean;
	changeProperties: CssRuleName[];
	keyframes: Map<string, CustomKeyframe>;
};

export type MainActions = {
	initStateFromProps(context: Context<MainState>, payload: BewegungProps): void;
	sendAppliableKeyframes(context: Context<MainState>, payload: AppliableKeyframes): Promise<void>;
	sendKeyframes(context: Context<MainState>, payload: resultingKeyframes): void;
	replyMainTransferObject(context: Context<MainState>): void;
	replyGeneralTransferObject(context: Context<MainState>): void;
	replyReadout(context: Context<MainState>, payload: Map<string, ElementReadouts>): void;
};

export type MainSchema = {
	state: MainState;
	methods: MainMethods;
	actions: MainActions;
};

export type Context<State> = {
	state: State;
	commit(method: any, payload?: any): void;
	dispatch(action: any, payload?: any): void;
	reply(queryMethodListener: any, queryMethodArguments: any): void;
};
