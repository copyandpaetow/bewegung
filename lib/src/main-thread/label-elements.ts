import {
	AtomicWorker,
	DomRepresentation,
	NormalizedProps,
	RootData,
	TreeElement,
	TreeEntry,
	TreeMedia,
} from "../types";
import { nextRaf, uuid } from "../utils/helper";

const getTextAttribute = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType !== 3) {
			return;
		}
		text += node.textContent!.trim().length;
	});

	return text;
};

const getMediaRatioAttribute = (element: HTMLElement) => {
	//@ts-expect-error
	if (!element.naturalWidth || !element.naturalHeight) {
		return 0;
	}
	return (element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight;
};

export const readElement = (element: HTMLElement, key: string, rootData: RootData): TreeEntry => {
	const dimensions = element.getBoundingClientRect();
	const style = window.getComputedStyle(element);

	if (element.tagName === "IMG" || element.tagName === "VIDEO") {
		return {
			currentLeft: dimensions.left,
			currentTop: dimensions.top,
			currentWidth: dimensions.width,
			currentHeight: dimensions.height,
			display: style.getPropertyValue("display"),
			borderRadius: style.getPropertyValue("border-radius"),
			position: style.getPropertyValue("position"),
			transform: style.getPropertyValue("transform"),
			transformOrigin: style.getPropertyValue("transform-origin"),
			objectFit: style.getPropertyValue("object-fit"),
			objectPosition: style.getPropertyValue("object-position"),
			ratio: getMediaRatioAttribute(element),
			key,
			...rootData,
		} as TreeMedia;
	}

	return {
		currentLeft: dimensions.left,
		currentTop: dimensions.top,
		currentWidth: dimensions.width,
		currentHeight: dimensions.height,
		display: style.getPropertyValue("display"),
		borderRadius: style.getPropertyValue("border-radius"),
		transform: style.getPropertyValue("transform"),
		transformOrigin: style.getPropertyValue("transform-origin"),
		position: style.getPropertyValue("position"),
		text: getTextAttribute(element),
		key,
		...rootData,
	} as TreeElement;
};

export const isNotVisible = (style: TreeEntry) => {
	return style.display === "none" || style.currentHeight === 0 || style.currentWidth === 0;
};

export const recordElement = (element: HTMLElement, rootData: RootData): DomRepresentation => {
	const key = (element.dataset.bewegungsKey ??= uuid(element.tagName));
	const entry = readElement(element, key, rootData);

	const representation: DomRepresentation = [];
	const children = element.children;
	const isElementHidden = isNotVisible(entry);

	for (let index = 0; index < children.length; index++) {
		const child = children.item(index) as HTMLElement;
		if (isElementHidden) {
			continue;
		}

		representation.push(recordElement(child, rootData));
	}

	return [entry, representation];
};

const filterPrimaryRoots = (entry: NormalizedProps, _: number, array: NormalizedProps[]) =>
	!array.some((innerEntry) => innerEntry.root.contains(entry.root) && entry !== innerEntry);

export const recordInitialDom = async (
	normalizedProps: NormalizedProps[],
	worker: AtomicWorker
) => {
	const { reply } = worker("domChanges");

	await nextRaf();

	console.time("domRepresentation1");
	const domRepresentation = normalizedProps
		.filter(filterPrimaryRoots)
		.map((entry) => recordElement(entry.root, { offset: 0, easing: entry.easing }));
	console.timeEnd("domRepresentation1");

	reply("sendDOMRepresentation", domRepresentation);
};
