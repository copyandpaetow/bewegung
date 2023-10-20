import {
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	ElementOrSelector,
	FullBewegungsOption,
	NormalizedOptions,
} from "../types";
import { uuid } from "./client-helper";

const defaultOptions: Required<BewegungsOption> & {
	from: VoidFunction | undefined;
	to: VoidFunction | undefined;
} = {
	duration: 400,
	easing: "ease",
	root: document.body,
	delay: 0,
	endDelay: 0,
	from: undefined,
	to: undefined,
	at: 0,
};

const normalizeStructure = (props: BewegungsEntry): Partial<FullBewegungsOption> => {
	if (typeof props === "function") {
		return { to: props };
	}

	if (!Array.isArray(props)) {
		return props;
	}

	if (typeof props[1] === "number") {
		return { to: props[0] as VoidFunction, duration: props[1] };
	}

	return { to: props[0] as VoidFunction, ...(props[1] as BewegungsOption) };
};

const getElement = (element: ElementOrSelector) => {
	let resultingElement: HTMLElement | null = null;

	if (typeof element === "string") {
		resultingElement = document.querySelector(element) as HTMLElement | null;
	} else if (element.isConnected) {
		resultingElement = element as HTMLElement;
	}

	if (!resultingElement) {
		console.warn("faulty root was provided, will use the body instead");
		return document.body;
	}

	return resultingElement;
};

const addMissingDefaults = (
	props: Partial<FullBewegungsOption>,
	defaultConfig?: Partial<BewegungsOption>
): NormalizedOptions => {
	const options = {
		...defaultOptions,
		...(defaultConfig ?? {}),
		...props,
		key: uuid("option"),
		startTime: 0,
		endTime: 0,
		totalRuntime: 0,
	} as NormalizedOptions;

	options.root = getElement(options.root);

	return options;
};

const calculateStartTime = (entry: NormalizedOptions, tempTime: { now: number }) => {
	const start = tempTime.now + entry.delay + entry.at;
	const end = start + entry.duration + entry.endDelay;

	entry.startTime = start;
	entry.endTime = end;
	tempTime.now = end;

	return entry;
};

export const normalizeArguments = (
	props: VoidFunction | FullBewegungsOption | BewegungsEntry[],
	config?: number | BewegungsOption | BewegungsConfig
) => {
	let propsWithDefaults: NormalizedOptions[] = [];
	let tempTime = { now: 0 };

	if (Array.isArray(props)) {
		propsWithDefaults = props
			.map(normalizeStructure)
			.map((entry) =>
				addMissingDefaults(entry, (config as BewegungsConfig | undefined)?.defaultOptions)
			);
	} else {
		const entry: BewegungsEntry = config
			? ([props as VoidFunction, config] as
					| [VoidFunction, BewegungsOption]
					| [VoidFunction, number])
			: props;

		propsWithDefaults = [addMissingDefaults(normalizeStructure(entry))];
	}

	return propsWithDefaults
		.map((entry) => calculateStartTime(entry, tempTime))
		.map((entry) => {
			entry.totalRuntime = tempTime.now;
			return entry;
		})
		.sort((a, b) => a.startTime - b.startTime);
};
