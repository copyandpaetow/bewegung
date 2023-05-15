export type ElementOrSelector = HTMLElement | Element | string;

export type BewegungsCallback = VoidFunction;
export type BewegungsOption = {
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

export type BewegungsEntry = [BewegungsCallback, BewegungsOption] | BewegungsCallback;

export type BewegungsConfig = {
	defaultOptions: Partial<BewegungsOption>;
};

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

export type DomChangeTransferable = {
	domTrees: Map<string, DomTree>;
	offset: number;
	currentTime: number;
};

export type StateTransferable = Map<string, NormalizedProps>;

export type ImageTransferable = DefaultTransferable & {
	placeholders: Map<string, string>;
	wrappers: Map<string, string>;
};

export type DefaultTransferable = {
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	keyframes: Map<string, Keyframe[]>;
	partialElements: Map<string, Keyframe[]>;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	imageResults: ImageTransferable;
	defaultResults: DefaultTransferable;
	textResults: DefaultTransferable;
	state: StateTransferable;
	updateState: Map<string, string>;
	animationTrees: Map<string, ResultingDomTree>;
};

export type TreeStyle = {
	currentTop: number;
	currentLeft: number;
	unsaveWidth: number;
	unsaveHeight: number;
	ratio: number;
	position: string;
	transform: string;
	transformOrigin: string;
	objectFit: string;
	objectPosition: string;
	display: string;
	borderRadius: string;
	text: number;
};

export type DomTree = {
	style: TreeStyle;
	key: string;
	root: string;
	easings: string;
	children: DomTree[];
};

export type TreeStyleWithOffset = TreeStyle & {
	offset: number;
	currentHeight: number;
	currentWidth: number;
};

export type IntermediateDomTree = {
	style: TreeStyleWithOffset[];
	key: string;
	root: string;
	easings: TimelineEntry[];
	children: IntermediateDomTree[];
};

export type ResultingDomTree = {
	key: string;
	keyframes: Keyframe[];
	overrides: Overrides;
	children: ResultingDomTree[];
};

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendImageResults: ImageTransferable;
	sendDefaultResults: DefaultTransferable;
	sendTextResults: DefaultTransferable;
	sendState: StateTransferable;
	sendStateUpdate: Map<string, string>;
	sendAnimationTrees: Map<string, ResultingDomTree>;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type AnimationState = {
	animations: Map<string, Animation>;
	elementResets: Map<string, Map<string, string>>;
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

export type DefaultReadouts = Omit<Partial<CSSStyleDeclaration>, "offset"> & {
	currentTop: number;
	currentLeft: number;
	unsaveWidth: number;
	unsaveHeight: number;
	currentWidth: number;
	currentHeight: number;
	offset: number;
};

export type DifferenceArray = [TreeStyleWithOffset, TreeStyleWithOffset];

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export type EasingTable = Record<number, string>;

export type WorkerState = {
	intermediateTree: Map<string, IntermediateDomTree>;
};

export interface StyleTables {
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
	easingTable: Record<number, string>;
}

export type NormalizedProps = {
	start: number;
	end: number;
	iterations: number;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
};

export type NormalizedPropsWithCallbacks = NormalizedProps & {
	callback: VoidFunction;
	root: HTMLElement;
};

export type DefaultResult = {
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	partialElements: Map<string, Keyframe[]>;
	animations: Map<string, Animation>;
	onStart: VoidFunction[];
};

export type ImageResult = DefaultResult & {
	placeholders: Map<string, string>;
	wrappers: Map<string, string>;
};

export type ClientAnimationTree = {
	animation: Animation | null;
	key: string;
	children: ClientAnimationTree[];
};

export type Overrides = {
	styles?: Partial<CSSStyleDeclaration>;
};

export type ParentTree = {
	style: TreeStyleWithOffset[];
	root: string[];
	overrides: Overrides;
	type: AnimationType;
	easings: TimelineEntry[];
};

export const enum Attributes {
	root = "data-bewegungs-root",
	key = "data-bewegungs-key",
	removeable = "data-bewegungs-removeable",
	rootEasing = "data-bewegungs-root-easing",
}

export type AnimationType = "default" | "addition" | "removal";
