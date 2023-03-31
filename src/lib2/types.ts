import { BidirectionalMap } from "./element-translations";

export type ElementOrSelector = HTMLElement | Element | string;

export type BewegungsConfig = {
	duration: number;
	iterations?: number;
	root?: ElementOrSelector;
	easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out";
	at?: number;
};

export type Options = Required<BewegungsConfig>;

export type BewegungsBlock = [VoidFunction, BewegungsConfig] | VoidFunction;

type OptinalConfigBlock = [BewegungsConfig?];

export type Bewegung = [...BewegungsBlock[], ...OptinalConfigBlock];

export type BewegungsOptions = [VoidFunction, Options];

export type Timeline = {
	start: number;
	end: number;
	easings: Set<string>;
	callbacks: Set<VoidFunction>;
}[];

export type TimelineEntry = {
	start: number;
	end: number;
	easing: string;
	callback: VoidFunction;
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
	changes: Map<string, DOMRect>;
	start: number;
	done: boolean;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	animations: Map<string, CSSStyleDeclaration>;
	easings: Map<number, Set<string>>;
};

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendAnimations: Map<string, CSSStyleDeclaration>;
	sendEasings: Map<number, Set<string>>;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type ElementRelatedState = {
	parents: Map<HTMLElement, HTMLElement>;
	sibilings: Map<HTMLElement, HTMLElement | null>;
	elementResets: Map<HTMLElement, Map<string, string>>;
	translations: BidirectionalMap<string, HTMLElement>;
};

export type DimensionState = {
	changes: IterableIterator<[number, Set<VoidFunction>]>;
	animations: Animation[];
};

export type Context = {
	rootElements: Set<ElementOrSelector>;
	totalRuntime: number;
	timeline: Map<number, Set<VoidFunction>>;
	worker: AtomicWorker;
	timekeeper: Animation;
	finishPromise: Promise<void>;
	resolve: (value: void | PromiseLike<void>) => void;
	reject: (reason?: any) => void;
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
