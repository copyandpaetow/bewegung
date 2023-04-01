import { defaultChangeProperties } from "./constants";
import { BidirectionalMap } from "./element-translations";
import { Context, DimensionState, ElementReadouts, ElementRelatedState } from "./types";

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
	});

const getElementStyles = (element: HTMLElement, offset: number) => {
	const { top, left, width, height } = element.getBoundingClientRect();
	const computedElementStyle = window.getComputedStyle(element);

	const computedStyles = Object.entries(defaultChangeProperties).reduce(
		(accumulator, [key, property]) => {
			accumulator[key] = computedElementStyle.getPropertyValue(property);
			return accumulator;
		},
		{} as ElementReadouts
	);

	return { ...computedStyles, top, left, width, height, offset };
};

const saveElementDimensions = (
	elementReadouts: Map<string, ElementReadouts[]>,
	translations: BidirectionalMap<string, HTMLElement>,
	offset: number
) => {
	elementReadouts.forEach((readouts, elementID) => {
		const domElement = translations.get(elementID)!;
		readouts.push(getElementStyles(domElement, offset));
	});

	return elementReadouts;
};

const resetStyle = (entry: MutationRecord, saveMap: Map<HTMLElement, Map<string, string>>) => {
	const target = entry.target as HTMLElement;
	const savedAttributes = saveMap.get(target)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

const resetElements = (entry: MutationRecord, elementState: ElementRelatedState) => {
	const { parents, sibilings } = elementState;

	entry.removedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const parentElement = parents.get(target as HTMLElement)!;
		const nextSibiling = sibilings.get(target as HTMLElement)!;

		parentElement.insertBefore(target, nextSibiling);
	});
};

const getElementReadouts = (translations: BidirectionalMap<string, HTMLElement>) => {
	const readouts = new Map<string, ElementReadouts[]>();

	translations.forEach((_, elementKey) => {
		readouts.set(elementKey, []);
	});

	return readouts;
};

export const setObserver = (
	elementState: ElementRelatedState,
	dimensionState: DimensionState,
	context: Context
) => {
	const { reply, cleanup } = context.worker("domChanges");
	const elementReadouts = getElementReadouts(context.elementTranslations);
	let currentChange = dimensionState.changes.next();
	let wasCallbackCalled = true;

	const nextChange = () => {
		currentChange = dimensionState.changes.next();
		return currentChange;
	};

	const callNextChange = (observer: MutationObserver) => {
		requestAnimationFrame(() => {
			wasCallbackCalled = false;
			currentChange.value[1].forEach((callback: VoidFunction) => {
				callback();
			});
			requestAnimationFrame(() => {
				if (wasCallbackCalled) {
					return;
				}
				observerCallback([], observer);
			});
		});
	};

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		wasCallbackCalled = true;
		const offset = currentChange.value[0];

		reply("sendDOMRects", {
			changes: saveElementDimensions(elementReadouts, context.elementTranslations, offset),
			done: Boolean(nextChange().done),
		});

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, elementState.elementResets);
					break;

				case "childList":
					resetElements(entry, elementState);
					break;

				case "characterData":
					//TODO: how to handle this?
					break;

				default:
					break;
			}
		});

		if (currentChange.done) {
			cleanup();
			return;
		}

		observe(observer);
		callNextChange(observer);
	};

	const observer = new MutationObserver(observerCallback);
	observe(observer);
	callNextChange(observer);

	return observer;
};
