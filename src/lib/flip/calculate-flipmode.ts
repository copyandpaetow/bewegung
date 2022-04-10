import {
	CalculatedProperties,
	ReadDimensions,
} from "../core/main-read-dimensions";
import { lastIn, firstIn } from "../utils/array-helpers";

const isElementHidden = (elementCalculations: CalculatedProperties) => {
	const { height, width } = elementCalculations.dimensions;
	const { display } = elementCalculations.styles;

	return [height, width].includes(0) || [display].includes("none");
};

export enum FlipMode {
	combined = "combined",
	applyStyleBeforeAnimation = "applyStyleBeforeAnimation",
	applyStyleAfterAnimation = "applyStyleAfterAnimation",
}

export const getFlipModes = (
	animationMap: Map<HTMLElement, ReadDimensions>
) => {
	const allCalculatedProperties = Array.from(
		animationMap.values(),
		(entry) => entry.calculatedProperties
	);

	const isAnyEndingElementHidden = allCalculatedProperties.some((entry) =>
		isElementHidden(lastIn(entry))
	);

	const isAnyStartingElementHidden = allCalculatedProperties.some((entry) =>
		isElementHidden(firstIn(entry))
	);

	if (isAnyEndingElementHidden && isAnyStartingElementHidden) {
		return FlipMode.combined;
	}

	return isAnyEndingElementHidden
		? FlipMode.applyStyleAfterAnimation
		: FlipMode.applyStyleBeforeAnimation;
};
