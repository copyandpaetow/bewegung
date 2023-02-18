import { BidirectionalMap } from "./shared/element-translations";

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

export type KeyedCustomKeyframeEffect = [
	target: string[],
	keyframes: EveryKeyframeSyntax,
	options: EveryOptionSyntax
];

export type NormalizedCustomKeyframeEffect = [
	target: string[],
	keyframes: CustomKeyframe[],
	options: BewegungsOptions
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
	animations: Map<HTMLElement, Animation>;
	onStart: VoidFunction[];
	timeKeeper: Animation;
}

export type EntryType = "image" | "text" | "";

export type Selector = {
	keyframes: CustomKeyframe[];
	options: BewegungsOptions;
};

export type GeneralState = {
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
};

export type KeyframeState = {
	readouts: Map<string, ElementReadouts[]>;
	remainingKeyframes: IterableIterator<Map<string, CustomKeyframe>>;
};

export type MainElementState = {
	options: Map<string, BewegungsOptions[]>;
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: Set<CssRuleName>;
	appliableKeyframes: Map<number, Map<string, CustomKeyframe>>;
};

export type ResultState = {
	overrides: Map<string, CustomKeyframe>;
	resultingStyle: Map<string, CustomKeyframe>;
	keyframes: Map<string, Keyframe[]>;
	totalRuntime: number;
	defaultReadouts: Map<string, ElementReadouts[]>;
	imageReadouts: Map<string, ElementReadouts[]>;
	placeholders: Map<string, string>;
	wrappers: Map<string, string>;
	easings: Map<string, Record<number, string>>;
} & Omit<MainElementState, "appliableKeyframes"> &
	GeneralState;

export type ResultTransferable = {
	totalRuntime: number;
	overrides: Map<string, CustomKeyframe>;
	resultingStyle: Map<string, CustomKeyframe>;
	keyframes: Map<string, Keyframe[]>;
	placeholders: Map<string, string>;
	wrappers: Map<string, string>;
};

export type ImageData = {
	ratio: number;
	maxWidth: number;
	maxHeight: number;
	easingTable: Record<number, string>;
};

export interface StyleTables {
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
	easingTable: Record<number, string>;
}

export type MainState = {
	resets: Map<HTMLElement, Map<string, string>>;
	root: Map<HTMLElement, HTMLElement>;
	translation: BidirectionalMap<string, HTMLElement>;
};

export type AppliableKeyframes = {
	changeProperties: Set<CssRuleName>;
	keyframes: Map<string, CustomKeyframe>;
};

export type GeneralTransferables = {
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
};

export type DefaultMessage = Record<string, any>;

export type MainMessages = {
	initState(
		context: MessageContext<MainMessages, WorkerMessages>,
		initialProps: CustomKeyframeEffect[]
	): void;
	receiveAppliableKeyframes(
		context: MessageContext<MainMessages, WorkerMessages>,
		AppliableKeyframes: AppliableKeyframes
	): void;
	receiveConstructedKeyframes(
		context: MessageContext<MainMessages, WorkerMessages>,
		constructedKeyframes: ResultTransferable
	): void;
};

export type WorkerMessages = {
	replyAppliableKeyframes(
		context: MessageContext<WorkerMessages, MainMessages>,
		appliableKeyframes: AppliableKeyframes
	): void;
	receiveMainState(
		context: MessageContext<WorkerMessages, MainMessages>,
		mainState: KeyedCustomKeyframeEffect[]
	): void;
	receiveGeneralState(
		context: MessageContext<WorkerMessages, MainMessages>,
		generalState: GeneralTransferables
	): void;
	receiveReadouts(
		context: MessageContext<WorkerMessages, MainMessages>,
		readouts: Map<string, ElementReadouts>
	): void;
	receiveKeyframeRequest(context: MessageContext<WorkerMessages, MainMessages>): void;
};

export type MessageContext<Sender, Receiver> = {
	reply(queryMethodListener: keyof Receiver, queryMethodArguments?: any): void;
	send(queryMethodListener: keyof Sender, queryMethodArguments?: any): void;
	terminate(): void;
};

type ExtendedPlayStates = "scrolling" | "reversing";
export type AllPlayStates = AnimationPlayState | ExtendedPlayStates;
export type StateMachine = Record<AllPlayStates, Partial<Record<AllPlayStates, VoidFunction>>>;

export type ReactivityCallbacks = {
	onMainElementChange(): void;
	onSecondaryElementChange(removedElements: HTMLElement[]): void;
	onDimensionOrPositionChange(): void;
	before: VoidFunction;
	after: VoidFunction;
};

export type Deferred = {
	promise: Promise<Result>;
	resolve: (value: Result | PromiseLike<Result>) => void;
};
