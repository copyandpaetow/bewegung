import { State } from "../types";

/*
added: main
get selectors, check if element matches any of those, get their keyframes, options, callbacks, rootElements and add those to the state
get the reset and update full

added: secondary
update fully

remove: main
remove from mainElements, update fully

remove: secondary
remove from secondaryElements, update partially


*/

const makeSelectorMap = (
	mainElements: Set<HTMLElement>,
	selectors: WeakMap<HTMLElement, string[]>
): Map<string, Set<HTMLElement>> => {
	const selectorMap = new Map<string, Set<HTMLElement>>();
	mainElements.forEach((mainElement) =>
		selectors.get(mainElement)?.forEach((selectorString) => {
			const existingValues =
				selectorMap.get(selectorString)?.add(mainElement) ?? new Set([mainElement]);
			selectorMap.set(selectorString, existingValues);
		})
	);
	return selectorMap;
};

const areTheseRelated = (a: HTMLElement, b: HTMLElement) => {
	return a.contains(b) || b.contains(a) || (a.parentElement ?? document.body).contains(b);
};

const handleElementAdditon = (mutations: MutationRecord[], state: State) => {
	const { mainElements, secondaryElements, selectors } = state;
	const selectorMap = makeSelectorMap(mainElements, selectors);

	mutations
		.flatMap((mutation) => mutation.addedNodes)
		.forEach((newElement) => {
			if (!(newElement instanceof HTMLElement)) {
				return;
			}
			selectorMap.forEach((mainElement, selector) => {
				if (newElement.matches(selector)) {
					//new main element
				}
			});
		});
};

export const observeMutations = (
	state: State,
	callbacks: { partial: VoidFunction; full: VoidFunction }
) => {
	const { MO } = state;
	const callback: MutationCallback = (mutations: MutationRecord[]) => {
		//handleElementAdditon(mutations, state);
	};
	const options: MutationObserverInit = {
		childList: true,
		subtree: true,
	};
	const rootElement = document.body;

	const observer = new MutationObserver(callback);
	observer.observe(rootElement, options);

	MO.set(rootElement, observer);
};
