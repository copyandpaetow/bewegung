export const iterateAttributesReversed = (
	entries: MutationRecord[],
	callback: (entry: MutationRecord) => void
) => {
	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index];
		if (entry.type !== "attributes") {
			continue;
		}
		callback(entry);
	}
};

export const iterateAddedElements = (
	entries: MutationRecord[],
	callback: (element: HTMLElement, index: number, entry: MutationRecord) => void
) => {
	entries.forEach((entry) =>
		entry.addedNodes.forEach((element, index) => {
			if (!isHTMLElement(element)) {
				return;
			}
			callback(element as HTMLElement, index, entry);
		})
	);
};

export const iterateRemovedElements = (
	entries: MutationRecord[],
	callback: (element: HTMLElement, entry: MutationRecord) => void
) => {
	entries.forEach((entry) =>
		entry.removedNodes.forEach((element) => {
			if (!isHTMLElement(element)) {
				return;
			}
			callback(element as HTMLElement, entry);
		})
	);
};

export const observe = (observer: MutationObserver) =>
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

export const isHTMLElement = (element: Node) => element.nodeType === Node.ELEMENT_NODE;
