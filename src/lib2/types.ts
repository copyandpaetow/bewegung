export type ElementOrSelector =
	| HTMLElement
	| Element
	| HTMLElement[]
	| Element[]
	| NodeListOf<Element>
	| HTMLCollection
	| string;

export type ValueOf<T> = T[keyof T];

export type CssRuleName = "cssOffset" | keyof CSSStyleDeclaration;

export type CustomKeyframeArrayValueSyntax = Partial<
	Record<CssRuleName, string[] | number[]> & {
		callback: VoidFunction[];
		offset: number[];
		class: string[];
		attribute: string[];
	}
>;

export type NonCSSEntries = {
	class: string;
	attribute: string;
	callback: VoidFunction;
	offset: number;
};

export type CustomKeyframe = Partial<Record<CssRuleName, string | number> & NonCSSEntries>;

export type EveryKeyframeSyntax =
	| CustomKeyframe
	| CustomKeyframe[]
	| CustomKeyframeArrayValueSyntax;

export interface BewegungsOptions extends KeyframeEffectOptions, ComputedEffectTiming {
	rootSelector?: string;
}

export type EveryOptionSyntax = number | BewegungsOptions | undefined;

export type CustomKeyframeEffect = [
	target: ElementOrSelector,
	keyframes: EveryKeyframeSyntax,
	options: EveryOptionSyntax
];

export type Callbacks = {
	callback: VoidFunction;
	offset: number;
};

export interface BewegungAPI {
	play: () => void;
	pause: () => void;
	scroll: (progress: number, done?: boolean) => void;
	reverse: () => void;
	cancel: () => void;
	commitStyles: () => void;
	finish: () => void;
	updatePlaybackRate: (newPlaybackRate: number) => void;
	readonly finished: Promise<void>;
	readonly playState: AnimationPlayState;
}

export type BewegungProps = CustomKeyframeEffect | (CustomKeyframeEffect | KeyframeEffect)[];

export interface AnimationsAPI {
	play: VoidFunction;
	playState: AnimationPlayState;
	finished: Promise<void>;
}

export type MainType = HTMLElement[][];
export type MainKeyframe = CustomKeyframe[][];

export type ElementReadouts = {
	dimensions: PartialDomRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
};

export type DifferenceArray = [ElementReadouts, ElementReadouts];

export type PartialDomRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

export type Override = {
	existingStyle: Partial<CSSStyleDeclaration>;
	override: Partial<CSSStyleDeclaration>;
};

export type StyleChangePossibilities = {
	style: Partial<CSSStyleDeclaration>;
	classes: string[];
	attributes: string[];
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export type Overrides =
	| {
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
	  }
	| undefined;

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}
export type Timeline = TimelineEntry[];

export type AnimationEntry = {
	target: HTMLElement[];
	keyframes: CustomKeyframe[];
	callbacks: Callbacks[];
	options: BewegungsOptions;
	selector: string;
};

export interface State {
	mainElements: Set<HTMLElement>;
	secondaryElements: Set<HTMLElement>;
	keyframes: WeakMap<HTMLElement, CustomKeyframe[][]>;
	callbacks: WeakMap<HTMLElement, Callbacks[][]>;
	options: WeakMap<HTMLElement, BewegungsOptions[]>;
	selectors: WeakMap<HTMLElement, string[]>;
	totalRuntime: number;
	rootElement: WeakMap<HTMLElement, HTMLElement>;
	cssStyleReset: WeakMap<HTMLElement, Map<string, string>>;
	animations: Map<HTMLElement, Animation>;

	onStart: WeakMap<HTMLElement, VoidFunction[]>;
	onEnd: WeakMap<HTMLElement, VoidFunction[]>;
}

export interface WatchState {
	IO: WeakMap<HTMLElement, IntersectionObserver>;
	RO: WeakMap<HTMLElement, ResizeObserver>;
	MO: MutationObserver | undefined;
}

export interface AnimationState {
	readouts: Map<HTMLElement, ElementReadouts[]>;
	imageReadouts: Map<HTMLImageElement, ElementReadouts[]>;
}

export interface CalculationState {
	calculations: DimensionalDifferences[];
	easingTable: Record<number, string>;
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
}

export interface MaximumDimensions {
	width: number;
	height: number;
}

export interface Result {
	animations: Map<HTMLElement, Animation>;
	callbackAnimations: Map<HTMLElement, Animation>;
	resetStyle: (element: HTMLElement) => void;
	onStart: (element: HTMLElement) => void;
	onEnd: (element: HTMLElement) => void;
	observe: (playState: AnimationPlayState) => VoidFunction;
}

export interface DomState {
	timings: number[];
	properties: CssRuleName[];
	keyframeMap: Map<number, Map<HTMLElement, StyleChangePossibilities>>;
}
