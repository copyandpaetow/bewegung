import { emptyNonZeroDOMRect } from "../constants";
import {
	calculatedElementProperties,
	cssRuleName,
	DimensionalDifferences,
} from "../types";
import { getComputedStylings } from "./dimensions";

const save = (value: number, alternative: number): number => {
	return value === Infinity || value === -Infinity || isNaN(value)
		? alternative
		: value;
};

const parseTransformOrigin = (entry: calculatedElementProperties) => {
	const transformOriginString = entry.computedStyle.transformOrigin!;

	const calculated = transformOriginString
		.split(" ")
		.map((value: string, index: number) => {
			if (value.includes("px")) {
				return parseFloat(value);
			}
			const heightOrWidth = index
				? entry.dimensions.height
				: entry.dimensions.width;

			return (parseFloat(value) / 100) * heightOrWidth;
		});

	return calculated;
};

const checkForTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (
		childNodes.length === 0 ||
		childNodes.every((node) => node.nodeType !== 3)
	) {
		return false;
	}

	return childNodes.every((node) =>
		Boolean(
			((node as Text).wholeText || (node as HTMLElement).innerText)
				//@ts-expect-error compiler weirdness
				?.replaceAll("\t", "")
				.replaceAll("\n", "")
		)
	);
};

export const calculateDimensionDifferences = (
	child: [calculatedElementProperties, calculatedElementProperties],
	parent: [calculatedElementProperties, calculatedElementProperties],
	element: HTMLElement
): DimensionalDifferences => {
	const [currentEntry, referenceEntry] = child;
	const [parentCurrentEntry, parentReferenceEntry] = parent;

	const current = currentEntry.dimensions;
	const reference = referenceEntry.dimensions;
	const parentCurrent = parentCurrentEntry.dimensions;
	const parentReference = parentReferenceEntry.dimensions;

	const [originReferenceX, originReferenceY] =
		parseTransformOrigin(referenceEntry);
	const [originParentReferenceX, originParentReferenceY] =
		parseTransformOrigin(parentReferenceEntry);

	const [originCurrentX, originCurrentY] = parseTransformOrigin(currentEntry);
	const [originParentCurrentX, originParentCurrentY] =
		parseTransformOrigin(parentCurrentEntry);

	const isTextNode = checkForTextNode(element);

	const parentWidthDifference = parentCurrent.width / parentReference.width;
	const parentHeightDifference = parentCurrent.height / parentReference.height;
	const childWidthDifference = current.width / reference.width;
	const childHeightDifference = current.height / reference.height;

	const heightDifference =
		(isTextNode ? 1 : childHeightDifference) / parentHeightDifference;
	const widthDifference =
		(isTextNode ? 1 : childWidthDifference) / parentWidthDifference;

	const currentXDifference =
		current.x + originCurrentX - (parentCurrent.x + originParentCurrentX);
	const referenceXDifference =
		reference.x +
		originReferenceX -
		(parentReference.x + originParentReferenceX);

	const currentYDifference =
		current.y + originCurrentY - (parentCurrent.y + originParentCurrentY);
	const referenceYDifference =
		reference.y +
		originReferenceY -
		(parentReference.y + originParentReferenceY);

	const positionCorrection = isTextNode
		? (parentCurrent.width - parentReference.width) / 2 / parentWidthDifference
		: 0;

	const xDifference =
		currentXDifference / parentWidthDifference -
		referenceXDifference -
		positionCorrection;
	const yDifference =
		currentYDifference / parentHeightDifference - referenceYDifference;

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		xDifference: save(xDifference, 0),
		yDifference: save(yDifference, 0),
		offset: currentEntry.offset,
	};
};

export const emptyCalculatedProperties = (
	changeProperties: cssRuleName[],
	changeTimings: number[]
): calculatedElementProperties[] =>
	changeTimings.map((timing) => ({
		dimensions: emptyNonZeroDOMRect,
		computedStyle: getComputedStylings(changeProperties),
		offset: timing,
	}));
