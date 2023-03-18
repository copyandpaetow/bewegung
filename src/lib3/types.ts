export type ElementOrSelector = HTMLElement | Element | string;

export type BewegungsConfig = {
	duration: number;
	iterations?: number;
	root?: ElementOrSelector;
	easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out";
	at?: number;
};

export type Options = Required<BewegungsConfig>;

export type BewegungsBlock = [VoidFunction, BewegungsConfig] | VoidFunction;

type OptinalConfigBlock = [BewegungsConfig?];

export type Bewegung = [...BewegungsBlock[], ...OptinalConfigBlock];

export type BewegungsOptions = [VoidFunction, Options];

export type ElementRelatedState = {
	parents: Map<HTMLElement, HTMLElement>;
	sibilings: Map<HTMLElement, HTMLElement | null>;
	elementResets: Map<HTMLElement, Map<string, string>>;
};

export type DimensionState = {
	dimensions: Map<HTMLElement, DOMRect[]>;
	changes: IterableIterator<Set<VoidFunction>>;
};
