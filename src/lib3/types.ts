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
	target: HTMLElement[];
	keyframes: ComputedKeyframe[];
	callbacks: Callbacks[] | null;
	options: ComputedEffectTiming;
	selector: string | null;
};
