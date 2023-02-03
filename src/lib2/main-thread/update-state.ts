import { getOrAddKeyFromLookup } from "../shared/element-translations";
import {
	CustomKeyframeEffect,
	EveryOptionSyntax,
	KeyedCustomKeyframeEffect,
	MainState,
} from "../types";
import { saveOriginalStyle } from "./css-resets";
import { compareRootElements } from "./find-affected-elements";
import { normalizeElements } from "./normalize-elements";

export const getSelectors = (props: CustomKeyframeEffect[]): string[] => {
	const selectors: string[] = [];

	props.forEach(([target]) => {
		if (typeof target !== "string") {
			return;
		}
		selectors.push(target);
	});

	return selectors;
};

export const getRootSelector = (options: EveryOptionSyntax): HTMLElement => {
	if (!options || typeof options === "number" || !options.rootSelector) {
		return document.body;
	}
	const root = document.querySelector(options.rootSelector) as HTMLElement | null;

	if (!root) {
		throw new Error("no element with that selector");
	}

	return root;
};

export const replaceTargetInputWithKeys = (
	initialProps: CustomKeyframeEffect[],
	state: MainState
): KeyedCustomKeyframeEffect[] => {
	const { translation } = state;

	return initialProps.map(([targets, keyframes, options]) => {
		const keys = normalizeElements(targets).map((element) => {
			return getOrAddKeyFromLookup(element, translation);
		});

		return [keys, keyframes, options];
	});
};

export const setElementRelatedState = (
	initialProps: KeyedCustomKeyframeEffect[],
	state: MainState
) => {
	const { root, resets, translation } = state;

	initialProps.forEach(([keys, _, options]) => {
		const localRoot = getRootSelector(options);

		keys.forEach((elementID) => {
			const domElement = translation.get(elementID)!;

			domElement.setAttribute("data-id", elementID);
			resets.set(domElement, saveOriginalStyle(domElement));
			root.set(domElement, compareRootElements(localRoot, root.get(domElement)));
		});
	});
};
