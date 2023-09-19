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

export const enum Display {
	none = 1,
	visible = 0,
}

export const enum Position {
	static = 0,
	relative = 1,
}

export const enum ObjectFit {
	cover = 1,
	fill = 0,
}

export type DomElement = {
	currentHeight: number;
	currentLeft: number;
	currentTop: number;
	currentWidth: number;
	key: string;
	offset: number;
	windowHeight: number;
	windowWidth: number;
	borderRadius?: string;
	display?: Display;
	position?: Position;
	text?: number;
	transform?: string;
	transformOrigin?: string;
	objectFit?: ObjectFit;
	objectPosition?: string;
	ratio?: number;
};

export type DomRepresentation = (DomElement | DomRepresentation)[];

export type TreeElement = {
	borderRadius: string;
	currentHeight: number;
	currentLeft: number;
	currentTop: number;
	currentWidth: number;
	display: Display;
	position: Position;
	key: string;
	offset: number;
	text: number;
	transform: string;
	transformOrigin: string;
	unsaveHeight: number;
	unsaveWidth: number;
	windowHeight: number;
	windowWidth: number;
	objectFit: ObjectFit;
	objectPosition: string;
	ratio: number;
};

export type TreeRepresentation = (TreeElement | DomRepresentation)[];

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
	current: TreeElement;
	reference: TreeElement;
	parent: TreeElement;
	parentReference: TreeElement;
};

export type RootDimensions = {
	current: TreeElement;
	reference: TreeElement;
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
