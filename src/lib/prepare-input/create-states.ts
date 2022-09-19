import { Chunk, Chunks, ElementKey, ElementState } from "../types";
import { findAffectedDOMElements } from "./find-affected-elements";
import { BidirectionalMap } from "./bidirectional-map";

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

export const createStates = (chunks: Chunks[]) => {
	const chunkState = new Map<string, Chunk>();
	const elementState = new Map<string, ElementKey>();
	const elementKeyMap = new BidirectionalMap<HTMLElement, string>();

	chunks.forEach((chunk) => {
		const { target, selector, ...remainingChunk } = chunk;
		const rootElement = document.querySelector(
			selector ?? "body"
		) as HTMLElement;
		const rootId = elementKeyMap.get(rootElement) ?? generateUUID("element-");
		const chunkId = generateUUID("chunk-");
		elementKeyMap.set(rootElement, rootId);
		chunkState.set(chunkId, { selector, ...remainingChunk });

		target.forEach((element) => {
			const id = elementKeyMap.get(element) ?? generateUUID("element-");
			const parent = element.parentElement ?? document.body;
			const parentId = elementKeyMap.get(parent) ?? generateUUID("element-");

			const key: ElementKey = {
				isMainElement: true,
				isTextNode: checkForTextNode(element),
				tagName: element.tagName,
				dependsOn: (elementState.get(id)?.dependsOn ?? new Set<string>()).add(
					chunkId
				),
				parent: parentId,
				root: rootId,
			};

			elementKeyMap.set(element, id);
			elementKeyMap.set(parent, parentId);

			elementState.set(id, key);
		});
	});

	chunks.forEach((chunk) => {
		const { target, selector } = chunk;

		const rootElement = document.querySelector(
			selector ?? "body"
		) as HTMLElement;
		const rootId = elementKeyMap.get(rootElement) ?? generateUUID("element-");

		target.forEach((mainElement) => {
			findAffectedDOMElements(mainElement, rootElement).forEach(
				(affectedElement) => {
					const affectedString = elementKeyMap.get(affectedElement);

					if (
						affectedString &&
						elementState.get(affectedString)?.isMainElement
					) {
						return;
					}
					const affectedID = affectedString ?? generateUUID("element-");
					const parent = affectedElement.parentElement ?? document.body;
					const parentId =
						elementKeyMap.get(parent) ?? generateUUID("element-");
					const mainId = elementKeyMap.get(mainElement)!;
					const dependencyChunks =
						elementState.get(mainId)?.dependsOn ?? new Set<string>();
					const dependsOn =
						elementState.get(affectedID)?.dependsOn ?? new Set<string>();

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
					elementState.set(affectedID, key);
				}
			);
		});
	});

	return { chunkState, elementState, elementKeyMap };
};
