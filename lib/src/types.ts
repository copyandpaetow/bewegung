import { WorkerContext } from "./utils/use-worker";

export type ElementOrSelector = HTMLElement | Element | string;

export type Easing =
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
	delay?: number;
	endDelay?: number;
	reduceMotion?: boolean;
	at?: number;
};

//requires at least "from" or "to" to be set
export type FullBewegungsOption = BewegungsOption &
	(
		| {
				from: VoidFunction;
		  }
		| {
				to: VoidFunction;
		  }
	);

//sequence([[cb, dur], [cb, options], cb, {}])

export type BewegungsEntry =
	| BewegungsCallback
	| [BewegungsCallback, BewegungsOption]
	| [BewegungsCallback, number]
	| FullBewegungsOption;

export type BewegungsInputs = BewegungsEntry[];
export type BewegungsConfig = {
	defaultOptions?: Partial<BewegungsOption>;
};

export type NormalizedOptions = {
	from: VoidFunction | undefined;
	to: VoidFunction | undefined;
	root: HTMLElement;
	duration: number;
	easing: Easing;
	delay: number;
	endDelay: number;
	reduceMotion: boolean;
	at: number;
	key: string;
};

export type PropsWithRelativeTiming = NormalizedOptions & {
	start: number;
	end: number;
};

export type PropsWithRelativeTiming2 = {
	start: number;
	end: number;
	root: HTMLElement;
	easing: Easing;
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
	imageKeyframeStore: Map<string, Keyframe[]>;
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>;
};

export type DomLabel = (string | DomLabel)[];

export type WorkerMessages = {
	sendDOMRepresentation: { key: string; dom: DomRepresentation };
} & {
	[key in `sendAnimationData-${string}`]: ResultTransferable;
};

export type MainMessages = {
	domChanges: Map<string, DomLabel>;
	treeUpdate: Map<string, DomLabel>;
} & {
	[key in `animationData-${string}`]: ResultTransferable;
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

export type RootDimensions = {
	current: TreeEntry;
	reference: TreeEntry;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
};

export type Reactivity = {
	observe(callback: VoidFunction): void;
	disconnect(): void;
};
