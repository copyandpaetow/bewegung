import { BEWEGUNG_DATA_ATTRIBUTE } from "../shared/constants";
import { getOrAddKeyFromLookup } from "../shared/element-translations";
import { task } from "../shared/use-worker";
import { AtomicWorker, EntryType, MainState } from "../types";

const filterPlaceholderElements = (element: HTMLElement) =>
	!element.hasAttribute(BEWEGUNG_DATA_ATTRIBUTE);

export const compareRootElements = (
	current: HTMLElement,
	previous: HTMLElement | undefined | null
) => {
	if (!previous || current === previous || current.contains(previous)) {
		return current;
	}
	if (previous.contains(current)) {
		return previous;
	}
	//here they are either siblings or the same element
	return current;
};

const getRootElement = (entries: HTMLElement[]): HTMLElement => {
	let root: HTMLElement | undefined;

	entries.forEach((rootElement: HTMLElement) => {
		root = compareRootElements(rootElement, root);
	});

	return root as HTMLElement;
};

const getAffectedElements = (state: MainState) => {
	const { translation, root, resets } = state;

	const affectedElementsMap = new Map<string, Set<string>>();
	const elementConnections = new Map<string, HTMLElement[]>();

	const mainElements = new Set(resets.keys());

	mainElements.forEach((domElement) => {
		const elementID = translation.get(domElement)!;
		const rootElement = root.get(domElement)!;
		const rootChildren = Array.from(rootElement.querySelectorAll("*")) as HTMLElement[];

		elementConnections.set(
			elementID,
			rootChildren.filter(filterPlaceholderElements).concat(rootElement)
		);
		affectedElementsMap.set(elementID, new Set([elementID]));
	});

	elementConnections.forEach((secondaryDomElements, mainElementID) => {
		secondaryDomElements.forEach((secondaryDomElement) => {
			const secondaryElementID = getOrAddKeyFromLookup(secondaryDomElement, translation);

			affectedElementsMap.set(
				secondaryElementID,
				(affectedElementsMap.get(secondaryElementID) ?? new Set<string>()).add(mainElementID)
			);
		});
	});
	return affectedElementsMap;
};

const getAffectedByElements = (affectedElementsMap: Map<string, Set<string>>, state: MainState) => {
	const { translation } = state;

	const affectedBy = new Map<string, string[]>();

	translation.forEach((_, elementID) => {
		const affectedByMainElements = affectedElementsMap.get(elementID)!;
		affectedBy.set(elementID, [...affectedByMainElements]);
	});

	return affectedBy;
};

const getRoot = (affectedElementsMap: Map<string, Set<string>>, state: MainState) => {
	const { translation, root } = state;
	const rootString = new Map<string, string>();

	translation.forEach((domElement, elementID) => {
		const affectedByMainElements = affectedElementsMap.get(elementID)!;
		const rootElement = getRootElement(
			Array.from(
				affectedByMainElements,
				(mainElementID: string) => root.get(translation.get(mainElementID)!)!
			)
		);
		root.set(domElement, rootElement);
		rootString.set(elementID, translation.get(rootElement)!);
	});

	return rootString;
};

const getParent = (state: MainState) => {
	const { translation } = state;
	const parent = new Map<string, string>();
	translation.forEach((domElement, elementID) => {
		parent.set(elementID, translation.get(domElement.parentElement!)!);
	});

	return parent;
};

export const getRatio = (state: MainState) => {
	const { translation } = state;
	const ratio = new Map<string, number>();

	translation.forEach((domElement, elementID) => {
		if (domElement.tagName !== "IMG") {
			return;
		}
		ratio.set(
			elementID,
			(domElement as HTMLImageElement).naturalWidth / (domElement as HTMLImageElement).naturalHeight
		);
	});
	return ratio;
};

const isTextNode = (element: HTMLElement) => {
	if (!element.hasChildNodes()) {
		return;
	}

	return Array.from(element.childNodes).every((node) => Boolean(node.textContent?.trim()));
};

const getType = (state: MainState) => {
	const { translation } = state;
	const type = new Map<string, EntryType>();

	translation.forEach((domElement, elementID) => {
		if (domElement.tagName === "IMG") {
			type.set(elementID, "image");
		}

		if (isTextNode(domElement)) {
			type.set(elementID, "text");
		}
	});

	return type;
};

export const getGeneralTransferObject = async (useWorker: AtomicWorker, state: MainState) => {
	const affectedElementsMap = getAffectedElements(state);
	await task(useWorker);

	return {
		affectedBy: getAffectedByElements(affectedElementsMap, state),
		root: getRoot(affectedElementsMap, state),
		parent: getParent(state),
		ratio: getRatio(state),
		type: getType(state),
	};
};

export const getGeneralState = async (useWorker: AtomicWorker, state: MainState) => {
	const { reply, cleanup } = useWorker("sendGeneralState");

	cleanup();
	reply("receiveGeneralState", await getGeneralTransferObject(useWorker, state));
	return Date.now();
};
