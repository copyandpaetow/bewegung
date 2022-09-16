import { CustomKeyframeEffect, ElementKey, PreChunk } from "../types";
import { BidirectionalMap } from "./bidirectional-map";
import { findAffectedDOMElements } from "./find-affected-elements";

export const toArray = <Value>(maybeArray: Value | Value[]): Value[] =>
	Array.isArray(maybeArray) ? maybeArray : [maybeArray];

const generateUUID = (prefix: string = "") => {
	return (
		prefix +
		"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0,
				v = c == "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		})
	);
};

/*
? if these are costing too much performance, use a simpler version 
export const uuid = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

*/

export const checkForTextNode = (element: HTMLElement) => {
	if (["IMG", "VIDEO"].includes(element.tagName)) {
		return false;
	}

	const childNodes = Array.from(element.childNodes);

	if (childNodes.length === 0) {
		return false;
	}

	return childNodes.every((node) => Boolean(node.textContent?.trim()));
};

export const createStructures = (props: CustomKeyframeEffect[]) => {
	const keyedChunkMap = new Map<string, PreChunk>();
	const keyedElementMap = new Map<string, ElementKey>();
	const elementKeyMap = new BidirectionalMap<HTMLElement, string>();

	props.forEach((chunk) => {
		const target = toArray(chunk[0]) as HTMLElement[];
		const keyframes = chunk[1];
		const options = chunk[2];
		const rootElement = document.querySelector(
			(typeof options === "object" ? options.rootSelector : "body") ?? "body"
		) as HTMLElement;
		const rootId = elementKeyMap.get(rootElement) ?? generateUUID("element-");
		const chunkId = generateUUID("chunk-");
		elementKeyMap.set(rootElement, rootId);
		keyedChunkMap.set(chunkId, { keyframes, options });

		target.forEach((element) => {
			const id = elementKeyMap.get(element) ?? generateUUID("element-");
			const parent = element.parentElement ?? document.body;
			const parentId = elementKeyMap.get(parent) ?? generateUUID("element-");

			const key: ElementKey = {
				isMainElement: true,
				isTextNode: checkForTextNode(element),
				tagName: element.tagName,
				dependsOn: (
					keyedElementMap.get(id)?.dependsOn ?? new Set<string>()
				).add(chunkId),
				parent: parentId,
				root: rootId,
			};

			elementKeyMap.set(element, id);
			elementKeyMap.set(parent, parentId);

			keyedElementMap.set(id, key);
		});
	});

	props.forEach((chunk) => {
		const target = toArray(chunk[0]) as HTMLElement[];
		const options = chunk[2];
		const rootElement = document.querySelector(
			(typeof options === "object" ? options.rootSelector : "body") ?? "body"
		) as HTMLElement;
		const rootId = elementKeyMap.get(rootElement) ?? generateUUID("element-");

		target.forEach((mainElement) => {
			findAffectedDOMElements(mainElement, rootElement).forEach(
				(affectedElement) => {
					const affectedString = elementKeyMap.get(affectedElement);

					if (
						affectedString &&
						keyedElementMap.get(affectedString)?.isMainElement
					) {
						return;
					}
					const affectedID = affectedString ?? generateUUID("element-");
					const parent = affectedElement.parentElement ?? document.body;
					const parentId =
						elementKeyMap.get(parent) ?? generateUUID("element-");
					const mainId = elementKeyMap.get(mainElement)!;
					const dependencyChunks =
						keyedElementMap.get(mainId)?.dependsOn ?? new Set<string>();
					const dependsOn =
						keyedElementMap.get(affectedID)?.dependsOn ?? new Set<string>();

					dependencyChunks.forEach((affectedByChunk) =>
						dependsOn.add(affectedByChunk)
					);

					const key: ElementKey = {
						isMainElement: false,
						isTextNode: checkForTextNode(affectedElement),
						tagName: affectedElement.tagName,
						dependsOn,
						parent: parentId,
						root: rootId,
					};
					elementKeyMap.set(affectedElement, affectedID);
					keyedElementMap.set(affectedID, key);
				}
			);
		});
	});

	return { keyedChunkMap, keyedElementMap, elementKeyMap };
};
