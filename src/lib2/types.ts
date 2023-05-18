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
};

export type ResultingDomTree = {
	key: string;
	keyframes: Keyframe[];
	overrides: Overrides;
	children: ResultingDomTree[];
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
	sendAnimationTrees: ResultTransferable;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	animationTrees: ResultTransferable;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type AnimationState = {
	animations: Map<string, Animation>;
	elementResets: Map<HTMLElement, Map<string, string>>;
};

export type AllPlayStates =
	| "finished"
	| "idle"
	| "paused"
	| "playing"
	| "scrolling"
	| "loading"
	| "canceled";

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
	isObserverRequired: false;
};

export type ClientAnimationTree = {
	animation: Animation | null;
	key: string;
	children: ClientAnimationTree[];
};

export type Overrides = {
	styles?: Partial<CSSStyleDeclaration>;
	wrapper?: {
		keyframes: Keyframe[];
		style: Partial<CSSStyleDeclaration>;
	};
	placeholder?: {
		style: Partial<CSSStyleDeclaration>;
	};
};

export type ParentTree = {
	key: string;
	style: TreeStyle[];
	overrides: Overrides;
	flag: AnimationFlag;
	easings: TimelineEntry[];
	isRoot: boolean;
};

export type AnimationFlag = "addition" | "removal";

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
	easing: EasingTable;
};

export type AnimationData = {
	keyframes: Map<string, Keyframe[]>;
	overrides: Map<string, Partial<CSSStyleDeclaration>>;
	isObserverRequired: boolean;
};
