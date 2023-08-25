import { BewegungsCallback, BewegungsOption, ElementOrSelector, NormalizedOptions } from "../types";
import { defaultOptions } from "../utils/constants";

export const getElement = (element: ElementOrSelector) => {
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

const preferesReducedMotion =
	window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

export const normalizeOptions = (
	props: BewegungsCallback | BewegungsOption,
	duration: number | undefined
) => {
	if (typeof props === "function") {
		return {
			preferesReducedMotion: preferesReducedMotion,
			options: {
				...defaultOptions,
				duration: duration ?? defaultOptions.duration,
				root: getElement(defaultOptions.root),
				to: props,
			} as NormalizedOptions,
		};
	}

	const { reduceMotion, ...rest } = props;

	const options = {
		...defaultOptions,
		...rest,
		root: getElement(rest?.root ?? defaultOptions.root),
	} as NormalizedOptions;

	return {
		options,
		preferesReducedMotion: reduceMotion ?? preferesReducedMotion,
	};
};

export const extractAnimationOptions = (options: NormalizedOptions) => {
	const { root, from, to, ...animationOptions } = options;

	return animationOptions;
};
