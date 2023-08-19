import {
	AtomicWorker,
	DomLabel,
	DomRepresentation,
	NormalizedProps,
	PropsWithRelativeTiming2,
	RootData,
	TreeElement,
	TreeEntry,
	TreeMedia,
} from "../types";
import { nextRaf, uuid } from "../utils/helper";
import { sortRoots } from "./update-timings";

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

export const readElement = (element: HTMLElement, rootData: RootData): TreeEntry => {
	const dimensions = element.getBoundingClientRect();
	const style = window.getComputedStyle(element);
	const key = (element.dataset.bewegungsKey ??= uuid(element.tagName));

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
			offset: rootData.offset,
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
		offset: rootData.offset,
	} as TreeElement;
};

export const isNotVisible = (style: TreeEntry) => {
	return style.display === "none" || style.currentHeight === 0 || style.currentWidth === 0;
};

export const recordElement = (element: HTMLElement, rootData: RootData): DomRepresentation => {
	const entry = readElement(element, rootData);
	const representation: DomRepresentation = [];
	const children = element.children;

	if (!isNotVisible(entry)) {
		for (let index = 0; index < children.length; index++) {
			const child = children.item(index) as HTMLElement;

			representation.push(recordElement(child, rootData));
		}
	}

	return [entry, representation];
};

export const recordDomLabels = (element: HTMLElement) => {
	const label = uuid(element.tagName);
	const childrenLabel: DomLabel = [];
	const children = element.children;

	element.dataset.bewegungsKey = label;

	for (let index = 0; index < children.length; index++) {
		childrenLabel.push(recordDomLabels(children.item(index) as HTMLElement));
	}

	return [label, childrenLabel];
};

export const filterPrimaryRoots = <Props extends NormalizedProps | PropsWithRelativeTiming2>(
	entry: Props,
	index: number,
	array: Props[]
) => !array.slice(index + 1).some((innerEntry) => innerEntry.root.contains(entry.root));

export const labelElements = async (normalizedProps: NormalizedProps[], worker: AtomicWorker) => {
	const { reply } = worker("domChanges");

	await nextRaf();

	console.time("domLabels");
	const domLabels = normalizedProps
		.sort(sortRoots)
		.filter(filterPrimaryRoots)
		.map((props) => recordDomLabels(props.root));
	console.timeEnd("domLabels");
	reply("sendInitialDOMRepresentation", domLabels);
};
