import { BidirectionalMap } from "./element-translations";

export type ElementOrSelector = HTMLElement | Element | string;

export type BewegungsConfig = {
	duration: number;
	iterations?: number;
	root?: ElementOrSelector;
	easing?:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
	at?: number;
};

export type Options = Required<BewegungsConfig>;

export type NormalizedOptions = Omit<Options, "at" | "duration" | "root"> & {
	start: number;
	end: number;
	root: string;
};

export type BewegungsBlock = [VoidFunction, BewegungsConfig] | VoidFunction;

type OptinalConfigBlock = [BewegungsConfig?];

export type Bewegung = [...BewegungsBlock[], ...OptinalConfigBlock];

export type BewegungsOptions = [VoidFunction, Options];

export type Timeline = TimelineEntry[] | TempTimelineEntry[];

export type TimelineEntry = {
	start: number;
	end: number;
	easing: string;
};

export type TempTimelineEntry = {
	start: number;
	end: number;
	easing: Set<string>;
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

type DomChangeTransferable = {
	changes: Map<string, ElementReadouts>;
	offset: number;
};

type StateTransferable = {
	parents: Map<string, string>;
	easings: Map<string, Set<TimelineEntry>>;
	ratios: Map<string, number>;
	textElements: Set<string>;
};

export type ResultTransferable = {
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	overrideResets: Map<string, Partial<CSSStyleDeclaration>>;
	placeholders: Map<string, string>;
	wrappers: Map<string, string>;
	keyframes: Map<string, Keyframe[]>;
	elementsToBeRemoved: Map<string, Keyframe[]>;
	elementsToBeAdded: Map<string, Keyframe[]>;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	results: ResultTransferable;
	state: StateTransferable;
};

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendResults: ResultTransferable;
	sendState: StateTransferable;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type MainState = {
	timekeeper: Animation;
	totalRuntime: number;
	parents: Map<string, string>;
	siblings: Map<string, string | null>;
	finishPromise: Promise<void>;
	resolve(value: any): void;
	reject(value: any): void;
	callbacks: Map<number, VoidFunction[]>;
	options: Map<VoidFunction, NormalizedOptions>;
	elementTranslations: BidirectionalMap<string, HTMLElement>;
	elementResets: Map<string, Map<string, string>>;
	easings: Map<string, Set<TimelineEntry>>;
	ratios: Map<string, number>;
	textElements: Set<string>;
	worker: AtomicWorker;
	animations: Map<string, Animation>;
	onStart: VoidFunction[];
};

export type Payload = {
	nextPlayState?: "scroll" | "play";
	progress?: number;
	done?: boolean;
};

export type PayloadFunction = (payload: Payload) => void;

type Events = {
	play: TransitionEntry;
	pause: TransitionEntry;
	finish: TransitionEntry;
	scroll: TransitionEntry;
	cancel: TransitionEntry;
};

export type AllPlayStates =
	| "finished"
	| "idle"
	| "paused"
	| "playing"
	| "scrolling"
	| "loading"
	| "canceled";

type Guard = {
	condition: string | string[];
	action?: string | string[];
	altTarget: AllPlayStates;
};

export type TransitionEntry = {
	target: AllPlayStates;
	action?: string | string[];
};

export type Definition = {
	on: Partial<Events>;
	exit?: string | string[];
	entry?: string | string[];
	action?: string | string[];
	guard?: Guard | Guard[];
};

export type StateMachineDefinition = {
	initialState: AllPlayStates;
	states: Record<AllPlayStates, Definition>;
	actions?: Record<string, PayloadFunction>;
	guards?: Record<string, () => boolean>;
};

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

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export type EasingTable = Record<number, string>;

export type WorkerState = {
	readouts: Map<string, ElementReadouts[]>;
	defaultReadouts: Map<string, ElementReadouts[]>;
	imageReadouts: Map<string, ElementReadouts[]>;
	parents: Map<string, string>;
	easings: Map<string, EasingTable>;
	ratios: Map<string, number>;
	textElements: Set<string>;
	timings: number[];
};

export type ImageState = {
	easing: EasingTable;
	readouts: ElementReadouts[];
	parentReadouts: ElementReadouts[];
	ratio: number;
	maxHeight: number;
	maxWidth: number;
};

export interface StyleTables {
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
	easingTable: Record<number, string>;
}
