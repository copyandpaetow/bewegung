export type ElementOrSelector =
	| Element
	| Element[]
	| HTMLElement
	| HTMLElement[];

export type CssRuleName = "cssOffset" | keyof CSSStyleDeclaration;

export type CustomKeyframeArrayValueSyntax = Partial<
	Record<CssRuleName, string[] | number[]> & {
		callback: VoidFunction[];
		offset: number | number[];
	}
>;

export type NonCSSEntries = {
	class: string;
	attribute: string;
	callback: VoidFunction;
	offset: number;
};

export type CustomKeyframe = Partial<
	Record<CssRuleName, string | number> & NonCSSEntries
>;

export type CustomKeyframeEffect = [
	target: ElementOrSelector,
	keyframes: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax,
	options?: number | ChunkOption
];

export type BewegungProps =
	| CustomKeyframeEffect
	| (CustomKeyframeEffect | KeyframeEffect)[];

export type KeyedCFE = [
	target: string[],
	keyframes: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax,
	options?: number | KeyframeEffectOptions
];

export interface ChunkOption extends ComputedEffectTiming {
	rootSelector?: string;
	composite?: CompositeOperation;
	iterationComposite?: IterationCompositeOperation;
	pseudoElement?: string | null;
}
export type Chunks = {
	target: string[];
	keyframes: ComputedKeyframe[];
	callbacks: Callbacks[] | null;
	options: ChunkOption;
};

export type MinimalChunks = {
	target: string[];
	keyframes: ComputedKeyframe[];
};

export type Callbacks = {
	callback: VoidFunction;
	offset: number;
};

export interface Context {
	changeTimings: number[];
	changeProperties: CssRuleName[];
	totalRuntime: number;
}

export type calculatedElementProperties = {
	dimensions: DOMRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
	naturalRatio?: number;
};
