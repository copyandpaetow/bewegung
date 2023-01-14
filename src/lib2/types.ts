import { BidirectionalMap } from "./shared/element-translations";

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
		offset: number[];
		class: string[];
		attribute: string[];
	}
>;

export type NonCSSEntries = {
	class: string;
	attribute: string;
	offset: number;
	easing: string;
	composite: string;
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

export type FillImplicitKeyframesOverload = {
	(keyframes: Keyframe[]): Keyframe[];
	(keyframes: CustomKeyframe[]): CustomKeyframe[];
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
	readonly finished: Promise<void>;
	readonly playState: AnimationPlayState;
}

export type BewegungProps = CustomKeyframeEffect | (CustomKeyframeEffect | KeyframeEffect)[];

export type ElementReadouts = Omit<Partial<CSSStyleDeclaration>, "offset"> & {
	currentTop: number;
	currentLeft: number;
	unsaveWidth: number;
	unsaveHeight: number;
	currentWidth: number;
	currentHeight: number;
	offset: number;
};

export type DifferenceArray = [ElementReadouts, ElementReadouts];

export type PartialDomRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

export type StyleChangePossibilities = {
	style?: Partial<CSSStyleDeclaration>;
	classes?: Set<string>;
	attributes?: Set<string>;
	offset: number;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export interface TimelineEntry {
	start: number;
	end: number;
	easing: string | string[];
}
export type Timeline = TimelineEntry[];

export interface Result {
	animations: Animation[];
	onStart: VoidFunction[];
	timeKeeper: Animation;
}

export type EntryType = "image" | "text" | "";

export type Selector = {
	keyframes: CustomKeyframe[];
	options: BewegungsOptions;
};

export interface WorkerState {
	keyframes: Map<string, CustomKeyframe[]>;
	options: Map<string, BewegungsOptions[]>;
	selectors: Map<string, [CustomKeyframe[], BewegungsOptions]>;
	totalRuntime: number;
	changeTimings: number[];
	changeProperties: CssRuleName[];
	appliableKeyframes: Map<string, CustomKeyframe>[];
	remainingKeyframes: number;
	readouts: Map<string, ElementReadouts[]>;
	affectedBy: Map<string, string[]>;
	parent: Map<string, string>;
	root: Map<string, string>;
	type: Map<string, EntryType>;
	ratio: Map<string, number>;
}

export interface ImageState {
	wrapperStyle: Partial<CSSStyleDeclaration>;
	placeholderStyle: Partial<CSSStyleDeclaration>;
	ratio: number;
	maxWidth: number;
	maxHeight: number;
	easingTable: Record<number, string>;
	wrapperKeyframes: Keyframe[];
	keyframes: Keyframe[];
	override: Partial<CSSStyleDeclaration>;
}

export interface StyleTables {
	borderRadiusTable: Record<number, string>;
	opacityTable: Record<number, string>;
	filterTable: Record<number, string>;
	userTransformTable: Record<number, string>;
	easingTable: Record<number, string>;
}

export interface DefaultKeyframes {
	keyframes: Keyframe[];
	resultingStyle: CustomKeyframe;
	override: CustomKeyframe;
}

export type MainTransferObject = {
	_keys: string[][];
	keyframes: EveryKeyframeSyntax[];
	options: EveryOptionSyntax[];
};

export type MainStateObject = {
	_keys: string[][];
	keyframes: CustomKeyframe[][];
	options: BewegungsOptions[];
};

export type GeneralTransferObject = {
	_keys: string[];
	root: string[];
	parent: string[];
	type: EntryType[];
	affectedBy: string[][];
	ratio: number[];
};

export type ExpandEntry = {
	(allTargets: string[][], entry: CustomKeyframe[][]): Map<string, CustomKeyframe[]>;
	(allTargets: string[][], entry: BewegungsOptions[]): Map<string, BewegungsOptions[]>;
	(allTargets: string[][], entry: [CustomKeyframe[][], BewegungsOptions[]]): Map<
		string,
		Selector[]
	>;
};

export type MainPatch = {
	op: "+" | "-";
	key: string;
	indices?: number[];
};

export type WorkerActions = {
	updateMainState(context: Context<WorkerSchema>, mainTransferObject: MainStateObject): void;
	updateGeneralState(
		context: Context<WorkerSchema>,
		generalTransferObject: GeneralTransferObject
	): void;
	updateRemainingKeyframes(context: Context<WorkerSchema>): void;
	updateReadouts(context: Context<WorkerSchema>, readouts: Map<string, ElementReadouts>): void;
	requestKeyframes(context: Context<WorkerSchema>): void;
	sendCurrentKeyframe(context: Context<WorkerSchema>): void;
};

export type WorkerMethods = {
	setMainState(context: Context<WorkerSchema>, transferObject: MainStateObject): void;
	clearState(context: Context<WorkerSchema>): void;
	updateRemainingKeyframes(context: Context<WorkerSchema>, payload: number): void;
	setReadouts(context: Context<WorkerSchema>, transferObject: Map<string, ElementReadouts>): void;
	setGeneralState(context: Context<WorkerSchema>, transferObject: GeneralTransferObject): void;
};

export type WorkerSchema = {
	state: WorkerState;
	methods: WorkerMethods;
	actions: WorkerActions;
};

export type MainState = {
	elementSelectors: string[];
	elementResets: Map<HTMLElement, Map<string, string>>;
	elementRoots: Map<HTMLElement, HTMLElement>;
	elementTranslation: BidirectionalMap<string, HTMLElement>;
	mainTransferObject: MainTransferObject;
	result: Promise<Result>;
	finishCallback: (value: Result | PromiseLike<Result>) => void;
};

export type MainMethods = {
	setMainTransferObject(context: Context<MainSchema>, payload: BewegungProps): void;
	updateMainTransferObject(context: Context<MainSchema>, patches: MainPatch[]): void;
};
export type ResultingKeyframes = [Map<string, ImageState>, Map<string, DefaultKeyframes>, number];

type AppliableKeyframes = {
	done: boolean;
	changeProperties: CssRuleName[];
	keyframes: Map<string, CustomKeyframe>;
};

type MainTransferObjectUpdates = {
	addedElements: [HTMLElement, number[]][];
	removedElements: [HTMLElement, number[]][];
};

export type MainActions = {
	initStateFromProps(context: Context<MainSchema>, payload: BewegungProps): void;
	patchMainState(context: Context<MainSchema>, payload: MainTransferObjectUpdates): void;
	sendAppliableKeyframes(context: Context<MainSchema>, payload: AppliableKeyframes): Promise<void>;
	sendKeyframes(context: Context<MainSchema>, payload: ResultingKeyframes): void;
	sendGeneralTransferObject(context: Context<MainSchema>): void;
};

export type MainSchema = {
	state: MainState;
	methods: MainMethods;
	actions: MainActions;
};

export type DefaultSchema = Record<"actions" | "methods" | "state", any>;

export type Context<Schema extends DefaultSchema> = {
	state: Schema["state"];
	commit(method: keyof Schema["methods"], payload?: any): void;
	dispatch(action: keyof Schema["actions"], payload?: any): void;
};

export type DefaultMessage = Record<string, any>;

export type MainMessages = {
	cache: {};
	sendMainTransferObject(
		context: MessageContext<MainMessages, WorkerMessages>,
		mainTransferObject: MainTransferObject
	): void;
	sendMainTransferPatch(
		context: MessageContext<MainMessages, WorkerMessages>,
		patches: MainPatch[]
	): void;
	sendGeneralTransferObject(
		context: MessageContext<MainMessages, WorkerMessages>,
		generalTransferObject: GeneralTransferObject
	): void;
	sendReadout(
		context: MessageContext<MainMessages, WorkerMessages>,
		readouts: Map<string, ElementReadouts>
	): void;
	sendRequestKeyframes(context: MessageContext<MainMessages, WorkerMessages>): void;
	receiveAppliableKeyframes(
		context: MessageContext<MainMessages, WorkerMessages>,
		AppliableKeyframes: AppliableKeyframes
	): void;
	receiveConstructedKeyframes(
		context: MessageContext<MainMessages, WorkerMessages>,
		constructedKeyframes: ResultingKeyframes
	): void;
};

export type WorkerMessages = {
	cache: {
		mainState: MainTransferObject | null;
	};
	replyConstructedKeyframes(
		context: MessageContext<WorkerMessages, MainMessages>,
		constructedKeyframes: ResultingKeyframes
	): void;
	replyAppliableKeyframes(
		context: MessageContext<WorkerMessages, MainMessages>,
		appliableKeyframes: AppliableKeyframes
	): void;
	receiveMainState(
		context: MessageContext<WorkerMessages, MainMessages>,
		mainState: MainTransferObject
	): void;
	receiveMainStatePatches(
		context: MessageContext<WorkerMessages, MainMessages>,
		patches: MainPatch[]
	): void;
	receiveGeneralState(
		context: MessageContext<WorkerMessages, MainMessages>,
		generalState: GeneralTransferObject
	): void;
	receiveReadouts(
		context: MessageContext<WorkerMessages, MainMessages>,
		readouts: Map<string, ElementReadouts>
	): void;
	receiveKeyframeRequest(context: MessageContext<WorkerMessages, MainMessages>): void;
};

export type MessageContext<Sender, Receiver> = {
	reply(queryMethodListener: keyof Receiver, queryMethodArguments?: any): void;
	send(queryMethodListener: keyof Sender, queryMethodArguments?: any): void;
	terminate(): void;
	//@ts-expect-error
	cache: Sender["cache"];
};

type ExtendedPlayStates = "scrolling" | "reversing";
export type AllPlayStates = AnimationPlayState | ExtendedPlayStates;
export type StateMachine = Record<AllPlayStates, Partial<Record<AllPlayStates, VoidFunction>>>;

export type ChangedElements = [HTMLElement, number[]][];
export type FullMOCallback = ({
	addedElements,
	removedElements,
}: {
	addedElements: ChangedElements;
	removedElements: ChangedElements;
}) => void;
