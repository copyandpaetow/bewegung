import { isElement } from "../shared/utils";
import { MainState } from "../types";

const getChangedElements = (state: MainState, selectors: string[], mutations: MutationRecord[]) => {
	const { translation, root } = state;
	const addedElements: HTMLElement[] = [];
	const removedElements: HTMLElement[] = [];

	mutations
		.flatMap((mutation) => Array.from(mutation.addedNodes))
		.filter(isElement)
		//@ts-expect-error ts doesnt recognize the filtering
		.forEach((element: HTMLElement) => {
			selectors.forEach((selector) => {
				if (!element.matches(selector)) {
					return;
				}
				addedElements.push(element);
			});

			root.forEach((rootElement) => {
				if (!rootElement.contains(element)) {
					return;
				}
				addedElements.push(element);
			});
		});

	mutations
		.flatMap((mutation) => Array.from(mutation.removedNodes))
		.filter(isElement)
		//@ts-expect-error ts doesnt recognize the filtering
		.forEach((element: HTMLElement) => {
			if (!translation.has(element)) {
				return;
			}
			removedElements.push(element);
		});

	return { addedElements, removedElements };
};

export const observeMutations = (
	state: MainState,
	selectors: string[],
	callback: (addedElements: HTMLElement[], removedElements: HTMLElement[]) => void
) => {
	const observer = new MutationObserver((mutations: MutationRecord[]) => {
		const { addedElements, removedElements } = getChangedElements(state, selectors, mutations);

		if (!addedElements.length && !removedElements.length) {
			return;
		}

		callback(addedElements, removedElements);
	});
	const rootElement = document.body;
	const options: MutationObserverInit = {
		childList: true,
		subtree: true,
	};

	observer.observe(rootElement, options);

	return () => {
		observer.disconnect();
	};
};
