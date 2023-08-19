import { AtomicWorker, DomLabel, PropsWithRelativeTiming2 } from "../types";
import { execute, querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { recordElement } from "./label-elements";

const resetNodeStyle = (entries: MutationRecord[]) => {
	[...entries].reverse().forEach((entry) => {
		const element = entry.target as HTMLElement;
		const attributeName = entry.attributeName as string;
		const oldValue = entry.oldValue ?? "";
		element.dataset.bewegungsReset = "";

		if (!oldValue && attributeName !== "style") {
			element.removeAttribute(attributeName);
			return;
		}

		element.setAttribute(attributeName, oldValue);
	});
};

const addKeyToNewlyAddedElement = (element: HTMLElement, index: number) => {
	const key = `key-added-${(element as HTMLElement).tagName}-${index}`;
	element.dataset.bewegungsKey = key;

	querySelectorAll("*", element).forEach((child, innerIndex) => {
		child.dataset.bewegungsKey = `${key}-${innerIndex}`;
	});
};

export const getNextElementSibling = (node: Node | null): HTMLElement | null => {
	if (node === null || isHTMLElement(node)) {
		return node as HTMLElement | null;
	}
	//@ts-expect-error node has the nextElementSibling property
	return getNextElementSibling(node.nextElementSibling);
};

export const separateEntries = (entries: MutationRecord[]) => {
	const removeEntries: MutationRecord[] = [];
	const addEntries: MutationRecord[] = [];
	const attributeEntries: MutationRecord[] = [];
	const characterDataEntries: MutationRecord[] = [];

	entries.forEach((entry) => {
		if (entry.type === "attributes") {
			attributeEntries.push(entry);
			return;
		}

		if (entry.type === "characterData") {
			characterDataEntries.push(entry);
			return;
		}

		if (entry.addedNodes.length > 0) {
			addEntries.push(entry);
			return;
		}
		removeEntries.push(entry);
	});

	return {
		removeEntries,
		addEntries,
		attributeEntries,
		characterDataEntries,
	};
};

export const readdRemovedNodes = (entries: MutationRecord[]) => {
	entries.forEach((entry) => {
		entry.removedNodes.forEach((element) => {
			entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
			if (isHTMLElement(element)) {
				(element as HTMLElement).dataset.bewegungsReset = "";
				(element as HTMLElement).dataset.bewegungsRemovable = "";
			}
		});
	});
};

const removeAddedNodes = (entries: MutationRecord[]) => {
	entries.forEach((entry) =>
		entry.addedNodes.forEach((node) => {
			//@ts-expect-error
			node?.remove();
		})
	);
};

const getDomLabels = (element: HTMLElement) => {
	const childrenLabel: DomLabel = [];
	const children = element.children;

	for (let index = 0; index < children.length; index++) {
		childrenLabel.push(getDomLabels(children.item(index) as HTMLElement));
	}

	return [element.dataset.bewegungsKey!, childrenLabel];
};

export const filterNested = (entry: HTMLElement, _: number, array: HTMLElement[]) =>
	!array.some((innerEntry) => innerEntry.contains(entry) && entry !== innerEntry);

const updateDomTree = (entries: MutationRecord[], worker: AtomicWorker) => {
	const { reply } = worker("treeUpdate");
	const update = new Map<string, DomLabel>();

	entries
		.flatMap((entry) => [...entry.addedNodes])
		.filter(isHTMLElement)
		//@ts-expect-error
		.filter(filterNested)
		.forEach((entry) => {
			const key = (entry as HTMLElement).parentElement!.dataset.bewegungsKey!;
			update.set(key, getDomLabels(entry as HTMLElement));
		});

	if (update.size === 0) {
		return;
	}
	reply("sendTreeUpdate", update);
};

export const addKeyToCustomElements = (entries: MutationRecord[]) => {
	entries
		.flatMap((entry) => [...entry.addedNodes])
		.filter(isHTMLElement)
		//@ts-expect-error
		.forEach(addKeyToNewlyAddedElement);
};

export const observe = (observer: MutationObserver) =>
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
	});

const stopRunningAnimations = (element: HTMLElement) => {
	const children = element.children;

	for (let index = 0; index < children.length; index++) {
		const child = children.item(index) as HTMLElement;
		element
			.getAnimations()
			.filter((anim) => anim.playState === "running")
			.forEach((anim) => {
				anim.pause();
				const currentTime = anim.currentTime;
				anim.currentTime = anim.effect!.getComputedTiming()!.endTime!;

				queueMicrotask(() => {
					anim.currentTime = currentTime;
					anim.play();
				});
			});

		stopRunningAnimations(child);
	}
};

export const observeDom = (
	domUpdates: Map<number, PropsWithRelativeTiming2[]>,
	worker: AtomicWorker
) =>
	new Promise<void>((resolve) => {
		const { reply, cleanup } = worker("domChanges");
		const changes = domUpdates.values();
		let current: IteratorResult<PropsWithRelativeTiming2[], PropsWithRelativeTiming2[]>;

		const callNextChange = (observer: MutationObserver) => {
			current = changes.next();

			if (current.done) {
				observer.disconnect();
				cleanup();
				resolve();
				return;
			}

			requestAnimationFrame(() => {
				observe(observer);
				current.value.forEach((entry) => {
					entry.root.style.contain = "layout";
					entry.callback.forEach(execute);
				});
			});
		};

		const observerCallback: MutationCallback = async (entries, observer) => {
			observer.disconnect();
			const { addEntries, removeEntries, attributeEntries } = separateEntries(entries);
			addKeyToCustomElements(addEntries);

			const domRepresentation = current.value.map((entry) =>
				recordElement(entry.root, {
					easing: entry.easing,
					offset: entry.end,
				})
			);

			reply("sendDOMRepresentation", domRepresentation);

			removeAddedNodes(addEntries);
			readdRemovedNodes(removeEntries);
			resetNodeStyle(attributeEntries);

			callNextChange(observer);
			updateDomTree(addEntries, worker);
		};

		callNextChange(new MutationObserver(observerCallback));
	});
