import { calculatedElementProperties } from "../state/calculations";

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
	offset: number;
}

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

export const calculateDimensionDifferences = (
	child: [calculatedElementProperties, calculatedElementProperties],
	parent: [calculatedElementProperties, calculatedElementProperties],
	target: HTMLElement
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

	const parentWidthDifference = parentCurrent.width / parentReference.width;
	const childWidthDifference = current.width / reference.width;
	const parentHeightDifference = parentCurrent.height / parentReference.height;
	const childHeightDifference = current.height / reference.height;

	const heightDifference = childHeightDifference / parentHeightDifference;
	const widthDifference = childWidthDifference / parentWidthDifference;
	// const widthDifference =
	// 	(target.childElementCount === 0 ? 1 : childWidthDifference) /
	// 	parentWidthDifference;

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

	// const textWidthDifference =
	// 	parseFloat(currentEntry.computedStyle.width!) ===
	// 	currentEntry.dimensions.width
	// 		? 1
	// 		: parseFloat(currentEntry.computedStyle.width!) /
	// 		  currentEntry.dimensions.width /
	// 		  parentWidthDifference;

	// const xDifference =
	// 	(currentXDifference / parentWidthDifference - referenceXDifference) *
	// 	textWidthDifference;
	const xDifference =
		currentXDifference / parentWidthDifference - referenceXDifference;
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
