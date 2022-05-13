import { CalculatedProperties } from "../core/main-read-dimensions";
import { save } from "../utils/number-helpers";

export interface DimensionalDifferences {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
}

type Entry = Omit<CalculatedProperties, "offset">;

const parseTransformOrigin = (entry: Entry) => {
	const transformOriginString = entry.styles.transformOrigin;

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
	child: [Entry, Entry],
	parent: [Entry, Entry],
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

	const currentHeightDifference = current.height / parentCurrent.height;
	const currentWidthDifference = current.width / parentCurrent.width;
	const referenceHeightDifference = reference.height / parentReference.height;
	const referenceWidthDifference = reference.width / parentReference.width;

	const heightDifference = currentHeightDifference / referenceHeightDifference;
	const widthDifference = currentWidthDifference / referenceWidthDifference;

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

	const xDifference = currentXDifference - referenceXDifference;
	const yDifference = currentYDifference - referenceYDifference;

	if (target.classList.contains("log")) {
		console.log({
			currentXDifference,
			xDifference,
			referenceXDifference,
			target,
			widthDifference,
		});
		console.log({
			referenceWidthDifference,
			currentWidthDifference,
			widthDifference,
			target,
		});
	}

	return {
		heightDifference: save(heightDifference, 1),
		widthDifference: save(widthDifference, 1),
		xDifference: save(xDifference, 0),
		yDifference: save(yDifference, 0),
	};
};
