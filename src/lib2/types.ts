export type ElementOrSelector =
	| HTMLElement
	| Element
	| HTMLElement[]
	| Element[]
	| NodeListOf<Element>
	| HTMLCollection
	| string;

export type cssRuleName = "cssOffset" | keyof CSSStyleDeclaration;

export type CustomKeyframeArrayValueSyntax = Partial<
	Record<cssRuleName, string[] | number[]> & {
		callback: VoidFunction[];
		offset: number | number[];
	}
>;

export type NonCSSEntries = {
	callback: VoidFunction;
	offset: number;
};

export type CustomKeyframe = Partial<
	Record<cssRuleName, string | number> & NonCSSEntries
>;

export type CustomKeyframeEffect = [
	target: ElementOrSelector,
	keyframes: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax,
	options?: number | KeyframeEffectOptions
];

export type Callbacks = {
	callback: VoidFunction;
	offset: number;
};

export type ValueOf<T> = T[keyof T];

export interface ChunkOption extends ComputedEffectTiming {
	rootSelector?: string;
}

export type Chunks = {
	target: Set<HTMLElement>;
	keyframes: ComputedKeyframe[];
	callbacks: Callbacks[] | null;
	options: ChunkOption;
	selector: string | null;
};

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}

export interface TimelineResult {
	start: number;
	end: number;
	easing: string;
}

export type Timeline = TimelineEntry[];
export interface Animate {
	playAnimation: () => void;
	pauseAnimation: () => void;
	keepProgress: () => void;
	scrollAnimation: (progress: number, done?: boolean) => void;
	reverseAnimation: () => void;
	cancelAnimation: () => void;
	commitAnimationStyles: () => void;
	finishAnimation: () => void;
	updatePlaybackRate: (newPlaybackRate: number) => void;
	finishPromise: Promise<Animation[]>;
	getPlayState: () => AnimationPlayState;
}

export type calculatedElementProperties = {
	dimensions: DOMRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
};
export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
	offset: number;
}

export type Observer = {
	disconnect: () => void;
	disconnectStateObserver: () => void;
};

export type Observerable<Value> = (updatedValue?: Value | undefined) => Value;

export type Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>
) => Observer;

export interface BewegungTypes {
	play: () => void;
	pause: () => void;
	scroll: (progress: number, done?: boolean) => void;
	reverse: () => void;
	cancel: () => void;
	commitStyles: () => void;
	finish: () => void;
	updatePlaybackRate: (newPlaybackRate: number) => void;
	finished: Promise<Animation[]>;
	playState: AnimationPlayState;
}

export type BewegungProps =
	| CustomKeyframeEffect
	| (CustomKeyframeEffect | KeyframeEffect)[];

export interface Context {
	changeTimings: number[];
	changeProperties: cssRuleName[];
	totalRuntime: number;
}

export type differenceArray = [
	calculatedElementProperties,
	calculatedElementProperties
];
