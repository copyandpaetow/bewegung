import { WorkerContext } from "./utils/use-worker";

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

export type BewegungsEntry = [BewegungsCallback, BewegungsOption?];

type PossibleBewegungsInputs = BewegungsCallback | BewegungsEntry;
export type BewegungsInputs = PossibleBewegungsInputs | PossibleBewegungsInputs[];
export type BewegungsConfig = {
	defaultOptions?: Partial<BewegungsOption>;
	reduceMotion?: boolean;
};

export type NormalizedProps = Required<BewegungsOption> & { callback: VoidFunction };

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

export type TreeStyle = {
	currentTop: number;
	currentLeft: number;
	currentHeight: number;
	currentWidth: number;
	unsaveWidth: number;
	unsaveHeight: number;
	ratio: string;
	position: string;
	transform: string;
	transformOrigin: string;
	objectFit: string;
	objectPosition: string;
	display: string;
	borderRadius: string;
	text: string;
	offset: number;
};

export type DomTree = {
	style: TreeStyle;
	key: string;
	easings: string;
	children: DomTree[];
	parent: DomTree | null;
};

export type DomChangeTransferable = {
	domTrees: Map<string, DomTree>;
	offset: number;
	currentTime: number;
};

export type ResultTransferable = {
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	flags: Map<string, AnimationFlag>;
};

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendAnimationData: ResultTransferable;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	animationData: ResultTransferable;
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
}

export type EasingTable = Record<number, string>;

export type WorkerState = {
	readouts: Map<string, TreeStyle[]>;
	easings: Map<string, TimelineEntry[]>;
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	flags: Map<string, AnimationFlag>;
};

export type AnimationFlag = "addition" | "removal";

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
	easing: EasingTable;
};

export type AnimationController = {
	prefetch(): Promise<void>;
	play(): Promise<void>;
	scroll(progress: number, done: boolean): Promise<void>;
	pause(): Promise<void>;
	cancel(): Promise<void>;
	finish(): void;
};
