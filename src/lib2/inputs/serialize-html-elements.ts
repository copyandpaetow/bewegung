import { findAffectedDOMElements } from "./find-affected-elements";
import { CustomKeyframeEffect } from "../types";
import { BidirectionalMap } from "./bidirectional-map";

export const toArray = <Value>(maybeArray: Value | Value[]): Value[] =>
	Array.isArray(maybeArray) ? maybeArray : [maybeArray];

const countPreviousSiblings = (
	element: HTMLElement,
	tagName: string,
	numberOfSiblings = 0
) => {
	// const previousElementSibling = element.previousElementSibling;

	// if (
	// 	(!previousElementSibling && !element.nextElementSibling) ||
	// 	element.tagName === "BODY"
	// ) {
	// 	return -1;
	// }

	// if (!previousElementSibling) {
	// 	return numberOfSiblings;
	// }

	// if (previousElementSibling.tagName !== tagName) {
	// 	return countPreviousSiblings(
	// 		previousElementSibling as HTMLElement,
	// 		tagName,
	// 		numberOfSiblings
	// 	);
	// }

	// return countPreviousSiblings(
	// 	previousElementSibling as HTMLElement,
	// 	tagName,
	// 	numberOfSiblings + 1
	// );

	//TODO the above perf is way better but more complicated
	//

	const siblings = Array.from(element.parentElement?.children ?? []);

	if (siblings.length <= 1) {
		return -1;
	}

	const filteredSiblingsForTags = siblings.filter(
		(element) => element.tagName === tagName
	);
	if (filteredSiblingsForTags.length === 1) {
		return -1;
	}

	return filteredSiblingsForTags.indexOf(element);
};

const stringifyElementPath = (element: HTMLElement): string => {
	const getCurrentPath = (element: HTMLElement, previousPath = "") => {
		const parent = element.parentElement;
		const tagName = element.tagName;
		const amountOfPreviousSiblings = countPreviousSiblings(element, tagName);
		const elementCount =
			amountOfPreviousSiblings > -1 ? `(${amountOfPreviousSiblings})` : "";

		const currentPath = `${tagName}${elementCount}/${previousPath}`;

		if (!parent || tagName === "BODY") {
			return currentPath;
		}

		return getCurrentPath(parent, currentPath);
	};

	return getCurrentPath(element);
};

export const serializeHtmlElements = (
	props: CustomKeyframeEffect[]
): BidirectionalMap<HTMLElement, string> => {
	const elementKeyMap = new BidirectionalMap<HTMLElement, string>();
	const mainElements = new Set(
		props.flatMap((chunk) => toArray(chunk[0]) as HTMLElement[])
	);

	props.forEach((chunk) => {
		const rootSelector =
			typeof chunk[2] === "object" ? chunk[2].rootSelector : "";

		(toArray(chunk[0]) as HTMLElement[]).forEach((element) => {
			elementKeyMap.set(element, `main:${stringifyElementPath(element)}`);

			findAffectedDOMElements(element, rootSelector).forEach((element) => {
				if (mainElements.has(element)) {
					return;
				}
				elementKeyMap.set(element, `affected:${stringifyElementPath(element)}`);
			});
		});
	});

	return elementKeyMap;
};
