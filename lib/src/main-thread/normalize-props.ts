import {
	BewegungsConfig,
	BewegungsEntry,
	BewegungsInputs,
	BewegungsOption,
	ElementOrSelector,
	NormalizedProps,
} from "../types";
import { defaultOptions } from "../utils/constants";

const getElement = (element: ElementOrSelector) => {
	if (typeof element === "string") {
		return document.querySelector(element) as HTMLElement | null;
	}
	if (element.isConnected) {
		return element as HTMLElement;
	}
	return null;
};

const hasOptionsObject = (props: BewegungsEntry | BewegungsEntry[]) => {
	return typeof props.at(-1) === "object" && !Array.isArray(props.at(-1));
};

const normalizeStructure = (props: BewegungsInputs) => {
	if (typeof props === "function") {
		return [[props, undefined] as BewegungsEntry];
	}

	if (hasOptionsObject(props as BewegungsEntry | BewegungsEntry[])) {
		return [props as BewegungsEntry];
	}

	return props.map((entry) => {
		if (Array.isArray(entry)) {
			return entry;
		}

		return [entry, undefined] as BewegungsEntry;
	});
};

const normalizeOptions = (props: BewegungsEntry[], config?: BewegungsConfig): NormalizedProps[] => {
	return props.map(([callback, options]) => {
		const combinedOptions: Required<BewegungsOption> = {
			...defaultOptions,
			...(config?.defaultOptions ?? {}),
			...(options ?? {}),
		};

		return { ...combinedOptions, callback };
	});
};

const normalizeRoot = (normalizedProps: NormalizedProps[]) => {
	//if there is an error with the root element, we skip it
	return normalizedProps.reduce((accumulator, current) => {
		const rootElement = getElement(current.root);

		if (rootElement) {
			accumulator.push({ ...current, root: rootElement });
		}
		return accumulator;
	}, [] as NormalizedProps[]);
};

export const normalize = (props: BewegungsInputs, config?: BewegungsConfig) => {
	const normalizedStructure = normalizeStructure(props);
	const normalizedOptions = normalizeOptions(normalizedStructure, config);
	const normalizedRoot = normalizeRoot(normalizedOptions);

	return normalizedRoot;
};
