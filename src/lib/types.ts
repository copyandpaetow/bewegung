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
	getCallbacks(key: ElementKey): Callbacks[] | undefined;
	getKeyframes(keys: ElementKey[]): ComputedKeyframe[] | undefined;
	getOptions(key: ElementKey): ChunkOption[] | undefined;
	getSelector(key: ElementKey): string[] | undefined;
	getAllKeyframes(): ComputedKeyframe[][];
	getAllOptions(): ChunkOption[];
}

export interface CallbackState {
	set(allCallbacks: VoidFunction[]): void;
	execute(): void;
}

export type ElementCallback = (value: HTMLElement, key: ElementKey) => void;
export type ElementKey = Record<string, boolean>;

export interface ElementState {
	forEachMain(callback: ElementCallback): void;
	forEach(callback: ElementCallback): void;
	getDependecyOptions(element: HTMLElement): ChunkOption[];
	getOptions(element: HTMLElement): ChunkOption[];
	getKeyframes(element: HTMLElement): ComputedKeyframe[];
	getCallbacks(element: HTMLElement): Callbacks[];
	getSelectors(element: HTMLElement): string[];
	getDependecySelectors(element: HTMLElement): string[];
	getKey(element: HTMLElement): ElementKey[] | undefined;
}
export interface StyleState {
	getOriginalStyle(key: ElementKey): Map<string, string> | undefined;
	getElementProperties(
		key: ElementKey
	): calculatedElementProperties[] | undefined;
	getStyleOverrides(key: ElementKey):
		| {
				existingStyle: Partial<CSSStyleDeclaration>;
				override: Partial<CSSStyleDeclaration>;
		  }
		| undefined;
	getRootDimensions(): DOMRect;
}

export interface DomChanges {
	originalStyle: WeakMap<ElementKey, Map<string, string>>;
	elementProperties: WeakMap<ElementKey, calculatedElementProperties[]>;
	elementState: ElementState;
	rootDimensions: DOMRect;
}

export interface DomStates {
	originalStyle: WeakMap<ElementKey, Map<string, string>>;
	elementProperties: WeakMap<ElementKey, calculatedElementProperties[]>;
	elementStyleOverrides: WeakMap<
		ElementKey,
		{
			existingStyle: Partial<CSSStyleDeclaration>;
			override: Partial<CSSStyleDeclaration>;
		}
	>;
	rootDimensions: DOMRect;
}
