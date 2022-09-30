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

export type EveryKeyframeSyntax =
	| CustomKeyframe
	| CustomKeyframe[]
	| CustomKeyframeArrayValueSyntax;

export type EveryOptionSyntax = number | KeyframeEffectOptions | undefined;

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

export type BewegungProps =
	| CustomKeyframeEffect
	| (CustomKeyframeEffect | KeyframeEffect)[];

export interface AnimationsAPI {
	play: VoidFunction;
	playState: AnimationPlayState;
	finished: Promise<void>;
}

export interface StructureOfChunks {
	elements: HTMLElement[][];
	keyframes: CustomKeyframe[][];
	callbacks: (Callbacks[] | null)[];
	options: KeyframeEffectOptions[];
	selectors: (string | null)[];
}

export type SoA = {
	targetArray: ElementOrSelector[];
	keyframeArray: EveryKeyframeSyntax[];
	optionsArray: EveryOptionSyntax[];
};
