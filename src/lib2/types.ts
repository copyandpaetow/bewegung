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
	finished: Promise<void>;
	playState: AnimationPlayState;
}

export type BewegungProps = CustomKeyframeEffect | (CustomKeyframeEffect | KeyframeEffect)[];

export interface AnimationsAPI {
	play: VoidFunction;
	playState: AnimationPlayState;
	finished: Promise<void>;
}

export type MainType = HTMLElement[][];
export interface StructureOfChunks {
	elements: MainType;
	keyframes: CustomKeyframe[][];
	callbacks: Callbacks[][];
	options: KeyframeEffectOptions[];
	selectors: string[];
}

export type ComputedState = {
	cssStyleReset: Map<string, string>[][];
	secondaryElements: MainType;
};

export type SoA = {
	targetArray: ElementOrSelector[];
	keyframeArray: EveryKeyframeSyntax[];
	optionsArray: EveryOptionSyntax[];
};

export interface QueueApi {
	enqueue: (...fn: Function[]) => void;
	run: () => Promise<void>;
}

export interface Context {
	// changeTimings: number[];
	// changeProperties: CssRuleName[];
	totalRuntime: number;
}

export type CalculatedElementProperties = {
	dimensions: PartialDomRect;
	computedStyle: Partial<CSSStyleDeclaration>;
	offset: number;
	naturalRatio: number | undefined;
};

export type PartialDomRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

export type Calculations = {
	primary: Record<number, CalculatedElementProperties>[][];
	secondary: Record<number, CalculatedElementProperties>[][];
};

export type Override = {
	existingStyle: Partial<CSSStyleDeclaration>;
	override: Partial<CSSStyleDeclaration>;
};

export type Overrides = {
	primary: Override[][];
	secondary: Override[][];
};

export type StyleChangePossibilities = {
	style: Partial<CSSStyleDeclaration>;
	classes: string[];
	attributes: string[];
};
