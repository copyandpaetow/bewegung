import { iterateMap } from "../utils/iterate-map";
import { CalculatedProperties, ReadDimensions } from "./main-read-dimensions";

const findNextRealDimension = (
	animationMap: CalculatedProperties[],
	index: number,
	direction: "forward" | "reverse" = "forward"
): DOMRect => {
	if (index > animationMap.length - 1) {
		return animationMap[index - 1].dimensions;
	}

	const nextIndex = direction === "forward" ? index + 1 : index - 1;
	if (animationMap[index].styles?.display === "none") {
		if (nextIndex === -1) {
			return findNextRealDimension(animationMap, index + 1, "forward");
		}
		return findNextRealDimension(animationMap, nextIndex, direction);
	}
	return animationMap[index].dimensions;
};

const postProcessDimensions = (
	animationMap: CalculatedProperties[]
): CalculatedProperties[] =>
	animationMap.map((property, index, array) => {
		const { dimensions, styles } = property;
		if (styles?.display !== "none") {
			return property;
		}

		const lastNonZeroDimensions = findNextRealDimension(
			array,
			index,
			index === 0 ? "forward" : "reverse"
		);

		const newDimension = {
			...lastNonZeroDimensions,
			height: dimensions.height,
			width: dimensions.width,
		};

		// const [transformOriginXPercentage, transformOriginYPercentage] =
		// 	entry.styles.transformOrigin;
		const newTransformOrigin = {
			...property.styles,
			transformOrigin: [
				// ? this would be more correct but everything not 50% 50% is not in the boundaries of the parent elements
				// transformOriginXPercentage * lastNonZeroDimensions.width,
				// transformOriginYPercentage * lastNonZeroDimensions.height,
				0,
				0,
			],
		};

		return {
			...property,
			dimensions: newDimension,
			style: newTransformOrigin,
		};
	});

export const updateMissingDimensions = (
	animationMap: Map<HTMLElement, ReadDimensions>
) =>
	iterateMap((value) => {
		return {
			...value,
			calculatedProperties: postProcessDimensions(value.calculatedProperties),
		};
	}, animationMap);
