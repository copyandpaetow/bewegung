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

//requires at least "from" or "to" to be set
export type BewegungsOption = {
	duration: number;
	root?: ElementOrSelector;
	easing?: Easing;
	delay?: number;
	endDelay?: number;
	reduceMotion?: boolean;
} & (
	| {
			from: VoidFunction;
	  }
	| {
			to: VoidFunction;
	  }
);

export type BewegungsEntry = [BewegungsCallback, BewegungsOption?];

export type PossibleBewegungsInputs = BewegungsCallback | BewegungsEntry;
export type BewegungsInputs = PossibleBewegungsInputs | PossibleBewegungsInputs[];
export type BewegungsConfig = {
	defaultOptions?: Partial<BewegungsOption>;
	reduceMotion?: boolean;
};

export type NormalizedOptions = {
	from: VoidFunction | undefined;
	to: VoidFunction | undefined;
	root: HTMLElement;
	duration: number;
	easing: Easing;
	delay: number;
	endDelay: number;
};

export type PropsWithRelativeTiming = {
	start: number;
	end: number;
	root: HTMLElement;
	easing: Easing;
	callback: VoidFunction;
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
	sendDOMRepresentation: DomRepresentation;
	sendAnimationData: ResultTransferable;
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
