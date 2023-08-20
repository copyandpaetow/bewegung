import { BewegungsOption, ElementOrSelector, NormalizedOptions, NormalizedProps } from "../types";
import { defaultOptions } from "../utils/constants";

export const getElement = (element: ElementOrSelector) => {
	if (typeof element === "string") {
		return document.querySelector(element) as HTMLElement | null;
	}
	if (element.isConnected) {
		return element as HTMLElement;
	}
	return null;
};

export const filterProps = (normalizedProps: NormalizedProps[]): NormalizedProps[] => {
	return normalizedProps.filter((entry) => entry.root.isConnected);
};

export const normalizeOptions = (
	callback: VoidFunction,
	unsaveOptions: BewegungsOption | undefined
): NormalizedOptions => {
	const options: Required<BewegungsOption> = {
		...defaultOptions,
		...(unsaveOptions ?? {}),
	};

	const rootElement = getElement(options.root)!;

	return {
		...options,
		callback,
		root: rootElement,
	};
};

export const extractAnimationOptions = (options: NormalizedOptions) => {
	const { root, callback, reduceMotion, ...animationOptions } = options;

	return animationOptions;
};
