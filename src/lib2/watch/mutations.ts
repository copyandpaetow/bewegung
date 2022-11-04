import { State, ValueOf, WatchState } from "../types";

/*
added: main
get selectors, check if element matches any of those, get their keyframes, options, callbacks, rootElements and add those to the state
get the reset and update full

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

const theseAreRelated = (a: HTMLElement, b: HTMLElement) => {
	return a.contains(b) || b.contains(a) || (a.parentElement ?? document.body).contains(b);
};

const isElement = (node: Node): boolean => node instanceof HTMLElement;

const copyMainElementProperties = (
	state: State,
	newElement: HTMLElement,
	matchingElements: Set<HTMLElement>
) => {
	matchingElements.forEach((mainElement) => {
		const keyframes = state.keyframes.get(mainElement)!;
		const options = state.options.get(mainElement)!;
		const callbacks = state.callbacks.get(mainElement)!;
		const selectors = state.selectors.get(mainElement)!;

		state.keyframes.set(
			newElement,
			state.keyframes.get(newElement)?.concat(keyframes) ?? keyframes
		);
		state.options.set(newElement, state.options.get(newElement)?.concat(options) ?? options);
		state.callbacks.set(
			newElement,
			state.callbacks.get(newElement)?.concat(callbacks) ?? callbacks
		);
		state.selectors.set(
			newElement,
			state.selectors.get(newElement)?.concat(selectors) ?? selectors
		);
	});
};

const handleElementAdditon =
	(state: State, callbacks: { partial: VoidFunction; full: VoidFunction }) =>
	(mutations: MutationRecord[]) => {
		const { mainElements, secondaryElements, selectors } = state;
		const selectorMap = makeSelectorMap(mainElements, selectors);
		let update = "nothing";

		//TODO: if this is to hard to calculate, add it in tasks
		mutations
			.flatMap((mutation) => Array.from(mutation.addedNodes))
			.filter(isElement)
			//@ts-expect-error ts doesnt get the filtering from above
			.forEach((newElement: HTMLElement) => {
				selectorMap.forEach((currentMainElements, selector) => {
					if (!newElement.matches(selector)) {
						return;
					}
					mainElements.add(newElement);
					copyMainElementProperties(state, newElement, currentMainElements);
					update = "full";
				});
				mainElements.forEach((mainElement) => {
					if (!theseAreRelated(mainElement, newElement)) {
						return;
					}
					secondaryElements.add(newElement);
					update = "full";
				});
			});

		mutations
			.flatMap((mutation) => Array.from(mutation.removedNodes))
			.filter(isElement)
			//@ts-expect-error ts doesnt get the filtering from above
			.forEach((newElement: HTMLElement) => {
				if (mainElements.delete(newElement)) {
					update = "full";
					return;
				}
				if (secondaryElements.delete(newElement) && update === "nothing") {
					update = "partial";
					return;
				}
			});
		callbacks[update]?.();
	};

export const observeMutations = (
	watchState: WatchState,
	state: State,
	callbacks: { partial: VoidFunction; full: VoidFunction }
) => {
	const callback: MutationCallback = handleElementAdditon(state, callbacks);

	const options: MutationObserverInit = {
		childList: true,
		subtree: true,
	};
	const rootElement = document.body;

	const observer = new MutationObserver(callback);
	observer.observe(rootElement, options);

	watchState.MO = observer;
};
