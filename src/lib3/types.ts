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

export type MainMessages = {
	domChanges: Map<string, DOMRect>;
	animations: Map<string, CSSStyleDeclaration>;
};

export type WorkerMessages = {
	sendDOMRects: Map<string, DOMRect>;
	sendAnimations: Map<string, CSSStyleDeclaration>;
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
	changes: IterableIterator<Set<VoidFunction>>;
	animations: Animation[];
};

export type Context = {
	userInput: BewegungsOptions[];
	totalRuntime: number;
	timeline: Map<number, Set<VoidFunction>>;
	worker: AtomicWorker;
	timekeeper: Animation;
};
