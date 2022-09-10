export type ElementOrSelector =
	| HTMLElement
	| Element
	| HTMLElement[]
	| Element[]
	| NodeListOf<Element>
	| HTMLCollection
	| string;

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
export type Timeline = TimelineEntry[];

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

export interface BewegungAPI {
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
	changeProperties: CssRuleName[];
	totalRuntime: number;
}

export type differenceArray = [
	calculatedElementProperties,
	calculatedElementProperties
];

export interface ChunkState {
	getCallbacks(element: HTMLElement): Callbacks[] | undefined;
	getKeyframes(element: HTMLElement): ComputedKeyframe[] | undefined;
	getOptions(element: HTMLElement): ChunkOption[] | undefined;
	getSelector(element: HTMLElement): string[] | undefined;
	getAllKeyframes(): ComputedKeyframe[][];
	getAllOptions(): ChunkOption[];
	getAllTargetElements(): Set<HTMLElement>;
}

export interface CallbackState {
	set(allCallbacks: VoidFunction[]): void;
	execute(): void;
}

export interface ElementState {
	getMainElements(): Set<HTMLElement>;
	isMainElement(element: HTMLElement): boolean;
	getAllElements(): HTMLElement[];
	getDependecyElements(element: HTMLElement): Set<HTMLElement> | undefined;
}

export interface StyleState {
	getOriginalStyle(element: HTMLElement): Map<string, string> | undefined;
	getElementProperties(
		element: HTMLElement
	): calculatedElementProperties[] | undefined;
	getStyleOverrides(element: HTMLElement):
		| {
				existingStyle: Partial<CSSStyleDeclaration>;
				override: Partial<CSSStyleDeclaration>;
		  }
		| undefined;
	getRootDimensions(): DOMRect;
}

export interface DomChanges {
	originalStyle: WeakMap<HTMLElement, Map<string, string>>;
	elementProperties: WeakMap<HTMLElement, calculatedElementProperties[]>;
	elementState: ElementState;
	chunkState: ChunkState;
	rootDimensions: DOMRect;
}

export interface DomStates {
	originalStyle: WeakMap<HTMLElement, Map<string, string>>;
	elementProperties: WeakMap<HTMLElement, calculatedElementProperties[]>;
	elementStyleOverrides: WeakMap<
		HTMLElement,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>;
	rootDimensions: DOMRect;
}
