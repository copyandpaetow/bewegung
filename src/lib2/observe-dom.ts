import { addElementToStates } from "./animation";
import { defaultChangeProperties } from "./constants";
import { BidirectionalMap } from "./element-translations";
import { ElementReadouts, MainState } from "./types";

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

const resetStyle = (entry: MutationRecord, state: MainState) => {
	const { elementTranslations, elementResets } = state;
	const target = entry.target as HTMLElement;
	const key = elementTranslations.get(target)!;
	const savedAttributes = elementResets.get(key)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

//? this relies on all callbacks creating a mutation-event=> mutation event indices would correlate to the callback order. Maybe this can be done safer
const handleElementAdditons = (
	entry: MutationRecord[],
	currentChange: [number, VoidFunction[]],
	state: MainState
) => {
	const { elementTranslations, options, worker, parents, easings, ratios, types } = state;
	const [offset, callbacks] = currentChange;
	entry.forEach((entry, index) => {
		if (entry.addedNodes.length === 0) {
			return;
		}
		const remainingOptions = new Set(
			callbacks.slice(index).map((callbackID) => options.get(callbackID)!)
		);

		entry.addedNodes.forEach((element) => {
			if (!(element instanceof HTMLElement)) {
				return;
			}

			[element, ...element.querySelectorAll("*")]
				.reduce((newElements, element, elementCount) => {
					const key = `${index}-${element.tagName}-${elementCount}`;
					if (elementTranslations.has(key)) {
						elementTranslations.updateValue(key, element as HTMLElement);
						return newElements;
					}
					elementTranslations.set(key, element as HTMLElement);
					newElements.push(element as HTMLElement);
					return newElements;
				}, [] as HTMLElement[])
				.forEach((element) => {
					addElementToStates(remainingOptions, element, state);
				});
		});
	});

	if (offset === 1) {
		//TODO: this sends the whole thing instead of some entries...
		worker("state").reply("sendState", {
			parents,
			easings,
			ratios,
			types,
		});
	}
};

const resetElements = (entry: MutationRecord, state: MainState) => {
	const { parents, siblings, elementTranslations } = state;

	entry.removedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		const key = elementTranslations.get(target)!;
		const parentElement = elementTranslations.get(parents.get(key)!)!;
		const nextSibiling = elementTranslations.get(siblings.get(key)!)!;

		parentElement.insertBefore(target, nextSibiling);
	});

	entry.addedNodes.forEach((target) => {
		if (!(target instanceof HTMLElement)) {
			return;
		}
		target.remove();
	});
};

export const setObserver = (state: MainState) => {
	const { worker, callbacks, elementTranslations } = state;
	const { reply, cleanup } = worker("domChanges");
	const changes = callbacks.entries();
	let currentChange = changes.next();

	const nextChange = () => {
		currentChange = changes.next();
		return currentChange;
	};

	const callNextChange = (observer: MutationObserver) => {
		requestAnimationFrame(() => {
			const callbacks = currentChange.value[1];

			if (callbacks.length === 0) {
				observerCallback([], observer);
				return;
			}

			callbacks.forEach((callback: VoidFunction) => {
				callback();
			});
		});
	};

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		const offset = currentChange.value[0];

		handleElementAdditons(entries, currentChange.value, state);

		reply("sendDOMRects", {
			changes: saveElementDimensions(elementTranslations, offset),
			offset,
		});

		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, state);
					break;

				case "childList":
					resetElements(entry, state);
					break;

				case "characterData":
					//TODO: how to handle this?
					break;

				default:
					break;
			}
		});
		if (Boolean(nextChange().done)) {
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
