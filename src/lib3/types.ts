export type VoidCallback = () => void;

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
		callback: VoidCallback[];
		offset: number | number[];
	}
>;

export type NonCSSEntries = {
	callback: VoidCallback;
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
	callback: VoidCallback;
	offset: number;
};

export type ValueOf<T> = T[keyof T];

export type Chunks = {
	target: Set<HTMLElement>;
	keyframes: ComputedKeyframe[];
	callbacks: Callbacks[] | null;
	options: ComputedEffectTiming;
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
	isPaused: () => boolean;
	getCurrentTime: () => number;
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

export type Observer = { disconnect: () => void };

export type Observerable<Value> = (updatedValue?: Value | undefined) => Value;
export type Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Progress: Observerable<number>
) => Observer;
