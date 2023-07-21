import { WorkerContext } from "./utils/use-worker";

export type ElementOrSelector = HTMLElement | Element | string;

export type BewegungsCallback = VoidFunction;
export type BewegungsOption = {
	duration: number;
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

export type BewegungsEntry = [BewegungsCallback, BewegungsOption?];

export type PossibleBewegungsInputs = BewegungsCallback | BewegungsEntry;
export type BewegungsInputs = PossibleBewegungsInputs | PossibleBewegungsInputs[];
export type BewegungsConfig = {
	defaultOptions?: Partial<BewegungsOption>;
	reduceMotion?: boolean;
};

export type NormalizedProps = Required<BewegungsOption> & {
	callback: VoidFunction;
	root: HTMLElement;
};

export type PropsWithRelativeTiming = {
	start: number;
	end: number;
	root: HTMLElement;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
	callback: VoidFunction;
};

export type PropsWithRelativeTiming2 = {
	start: number;
	end: number;
	root: HTMLElement;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
	callback: VoidFunction[];
};

export type RenderProps = {
	callback: VoidFunction[];
	root: HTMLElement;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
	offset: number;
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

export type TreeStyle = TreeStyleUpdate & {
	ratio: number;
	text: number;
	easing: string;
};

export type TreeElement = {
	key: string;
	text: number;
	currentTop: number;
	currentLeft: number;
	currentHeight: number;
	currentWidth: number;
	position: string;
	transform: string;
	transformOrigin: string;
	display: string;
	borderRadius: string;
	offset: number;
};

export type TreeMedia = {
	ratio: number;
	key: string;
	currentTop: number;
	currentLeft: number;
	currentHeight: number;
	currentWidth: number;
	position: string;
	transform: string;
	transformOrigin: string;
	objectFit: string;
	objectPosition: string;
	display: string;
	borderRadius: string;
	offset: number;
};

export type TreeEntry = TreeElement | TreeMedia;

export type DomRepresentation = (TreeEntry | DomRepresentation)[];

export type TreeStyleUpdate = {
	currentTop: number;
	currentLeft: number;
	currentHeight: number;
	currentWidth: number;
	position: string;
	transform: string;
	transformOrigin: string;
	objectFit: string;
	objectPosition: string;
	display: string;
	borderRadius: string;
	offset: number;
};

export type DomTree = {
	style: TreeStyle | TreeStyleUpdate;
	key: string;
	children: DomTree[];
};

export type MetaData = {
	allOffsets: number[];
	easings: Map<string, TimelineEntry[]>;
};

export type ResultTransferable = {
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
};

export type WorkerMessages = {
	sendDOMRepresentation: DomRepresentation[];
	sendAnimationData: ResultTransferable;
	sendMetaData: MetaData;
};

export type MainMessages = {
	domChanges: Map<string, DomTree>;
	animationData: ResultTransferable;
	metaData: MetaData;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type ChildParentDimensions = {
	current: TreeStyle;
	reference: TreeStyle;
	parent: TreeStyle;
	parentReference: TreeStyle;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
	easing: string;
}

export type Result = {
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
};

export type AnimationFlag = "addition" | "removal";

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
};

export type Reactivity = {
	observe(callback: VoidFunction): void;
	disconnect(): void;
};

export type Resolvable<Value> = {
	resolve: (value: Value | PromiseLike<Value>) => void;
	reject: (reason?: any) => void;
	promise: Promise<Value>;
};

export type ResultTree = {
	key: string;
	readouts: TreeStyle[];
	differences: DimensionalDifferences[];
	children: ResultTree[];
};

export type SortedProps = {
	independetEntries: PropsWithRelativeTiming2[];
	dependentEntries: PropsWithRelativeTiming2[];
};

export type RootData = {
	offset: number;
	easing:
		| "ease"
		| "ease-in"
		| "ease-out"
		| "ease-in-out"
		| "linear"
		| `cubic-bezier(${number},${number},${number},${number})`;
};
