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
	readonly finished: Promise<Animation[]>;
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

export type Result = {
	animations: Map<HTMLElement, Animation>;
	onStart: VoidFunction[];
	timeKeeper: Animation;
	totalRuntime: number;
} & MainState;

export type EntryType = "image" | "text" | "";

export type GeneralState = {
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
};

export type MainElementState = {
	options: Map<string, BewegungsOptions[]>;
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: Set<CssRuleName>;
	appliableKeyframes: Map<number, Map<string, CustomKeyframe>>;
	readouts: Map<string, ElementReadouts[]>;
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

export type DomChangeTransferable = {
	changeProperties: Set<CssRuleName>;
	appliableKeyframes: Map<number, Map<string, CustomKeyframe>>;
};

export type GeneralTransferables = {
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
};

type Readouts = { done: boolean; value: Map<string, ElementReadouts> };

export type MainMessages = {
	domChanges: DomChangeTransferable;
	receiveConstructedKeyframes: ResultTransferable;
	sendMainState: undefined;
	sendGeneralState: undefined;
	task: undefined;
};

export type WorkerMessages = {
	receiveMainState: KeyedCustomKeyframeEffect[];
	receiveGeneralState: GeneralTransferables;
	receiveKeyframeRequest: undefined;
	receiveReadouts: Readouts;
	receiveTask: undefined;
};

type ExtendedPlayStates = "scrolling" | "reversing";
export type AllPlayStates = AnimationPlayState | ExtendedPlayStates;
export type StateMachine = Record<AllPlayStates, Partial<Record<AllPlayStates, VoidFunction>>>;

export type ReactivityCallbacks = {
	onMainElementChange(removedElements: HTMLElement[], addedElements: HTMLElement[]): void;
	onSecondaryElementChange(removedElements: HTMLElement[]): void;
	onDimensionOrPositionChange(): void;
};

export type AnimationFactory = {
	results(): Promise<Result>;
	invalidateDomChanges(): void;
	invalidateGeneralState(): void;
	styleResultsOnly(): Promise<Map<HTMLElement, CustomKeyframe>>;
};

export type WorkerCallback<Current extends keyof Self, Self, Target> = (
	replyMethodArguments: Self[Current],
	context: WorkerContext<Current, Self, Target>
) => any;

export type WorkerError = (event: ErrorEvent) => void;

export type WorkerCallbackTypes<Current extends keyof Self, Self, Target> = {
	onMessage: WorkerCallback<Current, Self, Target>;
	onError: WorkerError;
};

export type WorkerMessageEvent<Current extends keyof Self, Self> = {
	replyMethodArguments: Self[Current];
	replyMethod: Current;
};

export type WorkerContext<Current extends keyof Self, Self, Target> = {
	reply(
		replyMethod: keyof Target,
		replyMethodArguments?: Target[keyof Target]
	): WorkerContext<Current, Self, Target>;
	cleanup(): void;
	onMessage(callback: WorkerCallback<Current, Self, Target>): Promise<unknown>;
	onError(errorCallback: WorkerError): void;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type InternalPayload = {
	onEnd: VoidFunction;
};

export type PlayStateManager = {
	current: () => AllPlayStates;
	next: (
		newState: AllPlayStates,
		payload?: { progress: number; done: boolean } | undefined
	) => Promise<AllPlayStates>;
};
