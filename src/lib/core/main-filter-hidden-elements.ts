import { iterateMap } from "../utils/iterate-map";
import { ReadDimensions } from "./main-read-dimensions";

const isElementAlwaysHidden = (value: ReadDimensions) =>
	value.calculatedProperties.every(
		(currentEntry) => currentEntry.styles.display === "none"
	);

export const filterHiddenElements = (
	animationMap: Map<HTMLElement, ReadDimensions>
) => {
	const hiddenElements = new Set();
	const filteredAnimationMap = iterateMap((value, key) => {
		if (isElementAlwaysHidden(value)) {
			hiddenElements.add(key);
			return false;
		}

		return value;
	}, animationMap);

	if (hiddenElements.size === 0) {
		return filteredAnimationMap;
	}

	return iterateMap((value) => {
		return {
			...value,
			affectedByElements: value.affectedByElements.filter(
				(element) => !hiddenElements.has(element)
			),
		};
	}, filteredAnimationMap);
};
