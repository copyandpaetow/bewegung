import { WorkerContext } from "./utils/use-worker";

export type ElementOrSelector = HTMLElement | Element | string;

type Easing =
	| "ease"
	| "ease-in"
	| "ease-out"
	| "ease-in-out"
	| "linear"
	| `cubic-bezier(${number},${number},${number},${number})`;

export type BewegungsCallback = VoidFunction;
export type BewegungsOption = {
	duration: number;
	root?: ElementOrSelector;
	easing?: Easing;
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
	callback: Set<VoidFunction>;
};

export type TreeElement = {
	key: string;
	text: number;
	currentTop: number;
	currentLeft: number;
	currentHeight: number;
	currentWidth: number;
	unsaveHeight: number;
	unsaveWidth: number;
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
	unsaveHeight: number;
	unsaveWidth: number;
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

export type ResultTransferable = {
	keyframeStore: Map<string, Keyframe[]>;
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>;
};

export type DomLabel = (string | DomLabel)[];

export type WorkerMessages = {
	sendDOMRepresentation: DomRepresentation[];
	sendInitialDOMRepresentation: DomLabel[];
	sendAnimationData: ResultTransferable;
	sendTreeUpdate: Map<string, DomLabel>;
};

export type MainMessages = {
	domChanges: Map<string, DomLabel>;
	animationData: ResultTransferable;
	treeUpdate: Map<string, DomLabel>;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type ChildParentDimensions = {
	current: TreeEntry;
	reference: TreeEntry;
	parent: TreeEntry;
	parentReference: TreeEntry;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
	id: string;
}

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

export type RootData = {
	offset: number;
	easing: Easing;
};
