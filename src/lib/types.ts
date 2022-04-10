export type ValueOf<T> = T[keyof T];

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

export type Callbacks = {
	callback: VoidCallback;
	offset: number;
};

export type CustomKeyframe = Partial<
	Record<cssRuleName, string | number> & Callbacks
>;

export interface Options extends KeyframeEffectOptions {
	onAnimationStart?: VoidCallback;
	onAnimationEnd?: VoidCallback;
	onAnimationPause?: VoidCallback;
	onAnimationCancel?: VoidCallback;
}

export interface Bewegung {}
