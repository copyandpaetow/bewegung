import { ElementRelatedState, AtomicWorker, DimensionState, Context } from "./types";

const observe = (observer: MutationObserver) =>
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
	});

const saveElementDimensions = (elementState: ElementRelatedState, worker: AtomicWorker) => {
	const { translations } = elementState;

	const currentChange = new Map<string, DOMRect>();

	translations.forEach((domElement, elementString) => {
		//TODO: we might need more information like from window.getComputedStyle
		currentChange.set(elementString, domElement.getBoundingClientRect());
	});

	//TODO: we need to know if this is the last change or not via a done property
	worker("domChanges").reply("sendDOMRects", currentChange);
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
	const [target] = entry.removedNodes;

	const parentElement = parents.get(target as HTMLElement)!;
	const nextSibiling = sibilings.get(target as HTMLElement)!;

	parentElement.insertBefore(target, nextSibiling);
};

export const setObserver = (
	elementState: ElementRelatedState,
	dimensionState: DimensionState,
	context: Context
) => {
	let currentChange = dimensionState.changes.next();
	let wasCallbackCalled = true;
	//TODO: this we only need conditionally, if not change is that the element should start on/from
	saveElementDimensions(elementState, context.worker);

	const observerCallback: MutationCallback = (entries, observer) => {
		observer.disconnect();
		wasCallbackCalled = true;
		saveElementDimensions(elementState, context.worker);

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

		currentChange = dimensionState.changes.next();

		console.log("observer done?", currentChange.done);

		if (currentChange.done) {
			return;
		}

		observe(observer);
		requestAnimationFrame(() => {
			wasCallbackCalled = false;
			currentChange.value.forEach((callback) => {
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

	const observer = new MutationObserver(observerCallback);
	observe(observer);

	requestAnimationFrame(() => currentChange.value.forEach((callback) => callback()));

	return observer;
};
