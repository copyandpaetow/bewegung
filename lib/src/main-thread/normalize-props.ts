import {
	BewegungsCallback,
	BewegungsEntry,
	BewegungsOption,
	ElementOrSelector,
	FullBewegungsOption,
	NormalizedOptions,
} from "../types";
import { defaultOptions } from "../utils/constants";
import { uuid } from "../utils/helper";

const normalizeStructure = (props: BewegungsEntry): Partial<FullBewegungsOption> => {
	if (typeof props === "function") {
		return { to: props };
	}

	if (!Array.isArray(props)) {
		return props;
	}

	if (typeof props[1] === "number") {
		return { to: props[0] as BewegungsCallback, duration: props[1] };
	}

	return { to: props[0] as BewegungsCallback, ...(props[1] as BewegungsOption) };
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

// export const filterProps = (normalizedProps: BewegungsOption[]): BewegungsOption[] => {
// 	return normalizedProps.filter((entry) => entry.root.isConnected);
// };

export const toBewegungsEntry = (
	props: BewegungsCallback | FullBewegungsOption,
	config: BewegungsOption | number | undefined
): BewegungsEntry =>
	config
		? ([props as BewegungsCallback, config] as
				| [BewegungsCallback, BewegungsOption]
				| [BewegungsCallback, number])
		: props;

export const normalizeOptions = (
	props: BewegungsEntry,
	defaultConfig?: Partial<BewegungsOption>
): NormalizedOptions => {
	const options = {
		...defaultOptions,
		...(defaultConfig ?? {}),
		...normalizeStructure(props),
		key: uuid("option"),
		timekeeper: new Animation(),
	};
	options.root = getElement(options.root);
	options.timekeeper = new Animation(
		new KeyframeEffect(null, null, extractAnimationOptions(options as NormalizedOptions))
	);

	return options as NormalizedOptions;
};

export const extractAnimationOptions = (options: NormalizedOptions): KeyframeEffectOptions => {
	return {
		duration: options.duration,
		delay: options.delay,
		endDelay: options.endDelay,
		easing: options.easing,
		composite: "add",
	};
};

export const getTotalRuntime = (props: NormalizedOptions[]) =>
	props.reduce((accumulator, current) => {
		return accumulator + current.at + current.duration;
	}, 0);
