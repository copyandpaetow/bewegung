import { isElement } from "../shared/utils";
import { ChangedElements, FullMOCallback, MainState } from "../types";

const handleElementAdditon =
	(state: MainState, full: FullMOCallback, partial: VoidFunction) =>
	(mutations: MutationRecord[]) => {
		const addedElements: ChangedElements = [];
		const removedElements: ChangedElements = [];

		let secondaryStateAffected = false;
		mutations
			.flatMap((mutation) => Array.from(mutation.addedNodes))
			.filter(isElement)
			//@ts-expect-error ts doesnt recognize the filtering
			.forEach((element: HTMLElement) => {
				const indices = state.elementSelectors.flatMap((selector, index) => {
					if (!element.matches(selector)) {
						return [];
					}
					return index;
				});
				if (indices.length) {
					addedElements.push([element, indices]);
					return;
				}

				state.elementRoots.forEach((rootElement) => {
					if (!rootElement.contains(element)) {
						return;
					}
					secondaryStateAffected = true;
				});
			});

		mutations
			.flatMap((mutation) => Array.from(mutation.removedNodes))
			.filter(isElement)
			//@ts-expect-error ts doesnt recognize the filtering
			.forEach((element: HTMLElement) => {
				if (!state.elementTranslation.has(element)) {
					return;
				}
				const elementString = state.elementTranslation.get(element)!;

				const indices = state.mainTransferObject._keys.flatMap((keys, index) => {
					if (!keys.includes(elementString)) {
						return [];
					}
					return index;
				});
				if (indices.length) {
					removedElements.push([element, indices]);
					return;
				}

				secondaryStateAffected = true;
			});

		if (addedElements.length || removedElements.length) {
			full({ addedElements, removedElements });
			return;
		}

		if (secondaryStateAffected) {
			partial();
		}
	};

export const observeMutations = (state: MainState, full: FullMOCallback, partial: VoidFunction) => {
	const callback: MutationCallback = handleElementAdditon(state, full, partial);
	const options: MutationObserverInit = {
		childList: true,
		subtree: true,
	};
	const rootElement = document.body;

	const observer = new MutationObserver(callback);
	observer.observe(rootElement, options);

	return () => {
		observer.disconnect();
	};
};
