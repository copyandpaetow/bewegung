import { saveOriginalStyle } from "./animation";
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
	translations: BidirectionalMap<string, HTMLElement>,
	offset: number
) => {
	const currentChange = new Map<string, ElementReadouts>();

	translations.forEach((domElement, elementString) => {
		currentChange.set(elementString, getElementStyles(domElement, offset));
	});

	return currentChange;
};

const resetStyle = (
	entry: MutationRecord,
	saveMap: Map<string, Map<string, string>>,
	translations: BidirectionalMap<string, HTMLElement>
) => {
	const target = entry.target as HTMLElement;
	const key = translations.get(target)!;
	const savedAttributes = saveMap.get(key)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

//? this relies on all callbacks creating a mutation-event and therefor will always have the same index. Maybe this can be done safer
const handleElementAdditons = (
	entry: MutationRecord[],
	elementState: ElementRelatedState,
	translations: BidirectionalMap<string, HTMLElement>
) => {
	entry.forEach((entry, index) => {
		entry.addedNodes.forEach((element) => {
			if (!(element instanceof HTMLElement)) {
				return;
			}
			[element, ...element.querySelectorAll("*")]
				.reduce((newElements, element, elementCount) => {
					const key = `${index}-${element.tagName}-${elementCount}`;
					if (translations.has(key)) {
						translations.updateValue(key, element as HTMLElement);
						return newElements;
					}
					translations.set(key, element as HTMLElement);
					newElements.push({ key, element: element as HTMLElement });
					return newElements;
				}, [] as { key: string; element: HTMLElement }[])
				.forEach((entry) => {
					const { key, element } = entry;
					const parentKey = translations.get(element.parentElement!)!;
					const siblingKey = element.nextElementSibling
						? translations.get(element.nextElementSibling as HTMLElement)!
						: null;
					elementState.parents.set(key, parentKey);
					elementState.sibilings.set(key, siblingKey);
					elementState.elementResets.set(key, saveOriginalStyle(element));
					//TODO: context need to be updated as well and the changes need to go to the worker
				});
		});
	});
};

const resetElements = (
	entry: MutationRecord,
	elementState: ElementRelatedState,
	translations: BidirectionalMap<string, HTMLElement>
) => {
	const { parents, sibilings } = elementState;

	entry.removedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const key = translations.get(target)!;
		const parentElement = translations.get(parents.get(key)!)!;
		const nextSibiling = translations.get(sibilings.get(key)!)!;

		parentElement.insertBefore(target, nextSibiling);
	});

	entry.addedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		target.remove();
	});
};

export const setObserver = (
	elementState: ElementRelatedState,
	dimensionState: DimensionState,
	context: Context
) => {
	const { reply, cleanup } = context.worker("domChanges");
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

		handleElementAdditons(entries, elementState, context.elementTranslations);

		reply("sendDOMRects", {
			changes: saveElementDimensions(context.elementTranslations, offset),
			done: Boolean(nextChange().done),
		});

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, elementState.elementResets, context.elementTranslations);
					break;

				case "childList":
					resetElements(entry, elementState, context.elementTranslations);
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
