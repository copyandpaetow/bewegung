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
	dimensions: PartialDomRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
	naturalRatio?: number;
};

export type ValueOf<T> = T[keyof T];

export type PartialDomRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

export type ElementKey = {
	isMainElement: boolean;
	isTextNode: boolean;
	tagName: string;
	dependsOn: Set<string>;
	parent: string;
	root: string;
};

export type PreChunk = {
	keyframes: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax;
	options: number | ChunkOption | undefined;
};

export interface FormatChunks {
	keyedChunkMap: Map<string, PreChunk>;
	keyedElementMap: Map<string, ElementKey>;
}

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}
export type Timeline = TimelineEntry[];

export type PreAnimation = {
	keyframes: Keyframe[];
	options: number;
	overwrite: Partial<CSSStyleDeclaration>;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
	offset: number;
}

export type differenceArray = [
	calculatedElementProperties,
	calculatedElementProperties
];
