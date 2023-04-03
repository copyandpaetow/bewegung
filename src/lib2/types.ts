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
	done: boolean;
};

type StateTransferable = {
	parents: Map<string, string>;
	easings: Map<string, Set<TimelineEntry>>;
	ratios: Map<string, number>;
	types: Set<string>;
};

export type AnimationTransferable = {
	animations: Map<string, Keyframe>;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	animations: AnimationTransferable;
	state: StateTransferable;
};

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendAnimations: AnimationTransferable;
	sendState: StateTransferable;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type ElementRelatedState = {
	parents: Map<string, string>;
	sibilings: Map<string, string | null>;
	elementResets: Map<string, Map<string, string>>;
};

export type DimensionState = {
	changes: IterableIterator<[number, Set<VoidFunction>]>;
	animations: Animation[];
};

export type Context = {
	options: Map<string, NormalizedOptions>;
	callbackTranslation: BidirectionalMap<string, VoidFunction>;
	elementTranslations: BidirectionalMap<string, HTMLElement>;
	totalRuntime: number;
	callbacks: Map<number, Set<VoidFunction>>;
	timekeeper: Animation;
	finishPromise: Promise<void>;
	resolve: (value: void | PromiseLike<void>) => void;
	reject: (reason?: any) => void;
	worker: AtomicWorker;
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

export type ElementReadouts = Omit<
	Partial<CSSStyleDeclaration>,
	"offset" | "top" | "left" | "width" | "height"
> & {
	top: number;
	left: number;
	width: number;
	height: number;
	offset: number;
};

export type EasingTable = Record<number, string>;

export type WorkerState = {
	dimensions: Map<string, ElementReadouts[]>;
	parents: Map<string, string>;
	easings: Map<string, EasingTable>;
	ratios: Map<string, number>;
	types: Set<string>;
};
