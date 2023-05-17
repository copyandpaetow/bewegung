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
};

export type DomTree = {
	style: TreeStyle;
	key: string;
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
	easings: TimelineEntry[];
	children: IntermediateDomTree[];
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

export type WorkerMessages = {
	sendDOMRects: DomChangeTransferable;
	sendAnimationTrees: Map<string, ResultingDomTree>;
};

export type MainMessages = {
	domChanges: DomChangeTransferable;
	animationTrees: Map<string, ResultingDomTree>;
};

export type AtomicWorker = <Current extends keyof MainMessages>(
	eventName: Current
) => WorkerContext<Current, MainMessages, WorkerMessages>;

export type AnimationState = {
	animations: Map<string, ClientAnimationTree>;
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
	current: TreeStyleWithOffset;
	reference: TreeStyleWithOffset;
	parent: TreeStyleWithOffset;
	parentReference: TreeStyleWithOffset;
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
	intermediateTree: Map<string, IntermediateDomTree>;
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
	style: TreeStyleWithOffset[];
	overrides: Overrides;
	type: AnimationType;
	easings: TimelineEntry[];
};

export type AnimationType = "default" | "addition" | "removal";

export type ImageDetails = {
	maxWidth: number;
	maxHeight: number;
	easing: EasingTable;
};
