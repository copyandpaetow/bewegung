export type ElementOrSelector = HTMLElement | Element | string;

type Easing =
	| "ease"
	| "ease-in"
	| "ease-out"
	| "ease-in-out"
	| "linear"
	| `cubic-bezier(${number},${number},${number},${number})`;

export type BewegungsOption = {
	duration: number;
	root?: ElementOrSelector;
	easing?: Easing;
	delay?: number;
	endDelay?: number;
	at?: number;
};

//requires at least "from" or "to" to be set
export type FullBewegungsOption = BewegungsOption &
	(
		| {
				from: VoidFunction;
		  }
		| {
				to: VoidFunction;
		  }
	);

type BewegungsCallback = VoidFunction;
type BewegungsCallbackWithNumber = [VoidFunction, number];
type BewegungsCallbackWithOptions = [VoidFunction, BewegungsOption];

export type BewegungsEntry =
	| BewegungsCallback
	| BewegungsCallbackWithNumber
	| BewegungsCallbackWithOptions
	| FullBewegungsOption;

export type BewegungsConfig = {
	defaultOptions?: Partial<BewegungsOption>;
};

export type BewegungsArgs = {
	(props: VoidFunction): Bewegung;
	(props: VoidFunction, options: number): Bewegung;
	(props: VoidFunction, options: BewegungsOption): Bewegung;
	(props: FullBewegungsOption): Bewegung;
	(props: BewegungsEntry[], options?: BewegungsConfig): Bewegung;
};

export type NormalizedOptions = {
	from: VoidFunction | undefined;
	to: VoidFunction | undefined;
	root: HTMLElement;
	duration: number;
	easing: Easing;
	delay: number;
	endDelay: number;
	at: number;
	key: string;
	startTime: number;
	endTime: number;
	totalRuntime: number;
};

export const enum Display {
	inline = 2,
	none = 1,
	visible = 0,
}

export const enum Position {
	static = 0,
	relative = 1,
}

export const enum ObjectFit {
	none = 2,
	cover = 1,
	fill = 0,
}

export const enum Attributes {
	key = "data-bewegungs-key",
	reset = "data-bewegungs-reset",
	removable = "data-bewegungs-removable",
	cssReset = "data-bewegungs-css-reset",
}

export type DomElement = {
	currentHeight: number;
	currentLeft: number;
	currentTop: number;
	currentWidth: number;
	key: string;
	offset: number;
	windowHeight: number;
	windowWidth: number;
	borderRadius?: string;
	display?: Display;
	position?: Position;
	text?: number;
	transformOrigin?: string;
	objectFit?: ObjectFit;
	objectPosition?: string;
	ratio?: number;
};

export type DomRepresentation = (DomElement | DomRepresentation)[];

export type TreeElement = {
	borderRadius: string;
	currentHeight: number;
	currentLeft: number;
	currentTop: number;
	currentWidth: number;
	display: Display;
	position: Position;
	key: string;
	offset: number;
	text: number;
	transformOrigin: [number, number];
	unsaveHeight: number;
	unsaveWidth: number;
	windowHeight: number;
	windowWidth: number;
	objectFit: ObjectFit;
	objectPosition: [number, number];
	ratio: number;
	visibility: boolean;
};

export type TreeRepresentation = (TreeElement | TreeRepresentation)[];

export type Result = [Keyframe[], Partial<CSSStyleDeclaration>?];

export type ResultTransferable = Map<string, Result>;

export type ChildParentDimensions = {
	current: TreeElement;
	reference: TreeElement;
	parent: TreeElement;
	parentReference: TreeElement;
};

export type RootDimensions = {
	current: TreeElement;
	reference: TreeElement;
};

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	leftDifference: number;
	topDifference: number;
	offset: number;
}

export type Bewegung = {
	play(): void;
	pause(): void;
	reverse(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	forceUpdate(index?: number | number[]): void;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

export type DomDiffCallback = (
	dimensions: [TreeElement, TreeElement],
	differences: DimensionalDifferences[],
	parentDimensions: [TreeElement, TreeElement] | undefined
) => void;

export type Results = {
	immediate: Map<string, Result>;
	delayed: Map<string, Result>;
};

export type WorkerPayloadMap = {
	[key in `animationData-${string}`]: ResultTransferable;
} & { [key in `delayedAnimationData-${string}`]: ResultTransferable } & {
	domChanges: [string, DomRepresentation];
	startDelayed: string;
};

type WorkerPayload<Payload> =
	| {
			error: string;
			data: undefined;
	  }
	| {
			error: undefined;
			data: Payload;
	  };

export type WorkerCallback<Payload> = (payload: WorkerPayload<Payload>) => void;

export interface Messenger {
	on<Key extends keyof WorkerPayloadMap>(
		key: Key,
		callback: WorkerCallback<WorkerPayloadMap[Key]>
	): void;
	off<Key extends keyof WorkerPayloadMap>(
		key: Key,
		callback: WorkerCallback<WorkerPayloadMap[Key]>
	): void;
	send<Key extends keyof WorkerPayloadMap>(key: Key, payload: WorkerPayloadMap[Key]): void;
}
