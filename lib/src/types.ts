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
	children: DomTree[];
	parent: DomTree | null;
	parentRoot: string;
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
	sendDOMRects: Map<string, DomTree>;
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
}

export type WorkerState = {
	readouts: Map<string, Map<number, TreeStyle>>;
	easings: Map<string, TimelineEntry[]>;
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	lastReadout: Map<string, string>;
	pastOffsets: number[];
};

export type AnimationFlag = "addition" | "removal";

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
	easing: Map<number, string>;
};

type AnimationMethods = "play" | "pause" | "seek" | "cancel" | "finish";
//todo: needs to be more refined
export type AnimationController = {
	queue(method: AnimationMethods, payload?: any): void;
	finished(): Promise<Animation>;
	playState(): AnimationPlayState;
};

export type Reactivity = {
	observe(callback: VoidFunction): void;
	disconnect(): void;
};

export type AnimationCalculator = {
	run(
		updateFn?: (normalizedProps: NormalizedProps[]) => NormalizedProps[]
	): Promise<Map<string, Animation>>;
};
