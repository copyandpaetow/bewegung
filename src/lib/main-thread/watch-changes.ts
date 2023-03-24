import { ReactivityCallbacks, Result } from "../types";
import { observerDimensions } from "./watch-dimensions";
import { observeMutations } from "./watch-mutations";
import { observeResizes } from "./watch-resizes";

export const reactivity = (
	results: Result,
	selectors: string[],
	{
		onDimensionOrPositionChange,
		onSecondaryElementChange,
		onMainElementChange,
	}: ReactivityCallbacks
) => {
	const unobserveRO = observeResizes(onDimensionOrPositionChange, results);
	const unobserveIO = observerDimensions(onDimensionOrPositionChange, results);

	const unobserveMO = observeMutations(
		results,
		selectors,
		(addedElements: HTMLElement[], removedElements: HTMLElement[]) => {
			const addedMainElements = addedElements.filter((element) => results.resets.has(element));
			const removedMainElements = addedElements.filter((element) => results.resets.has(element));

			if (addedMainElements.length || removedMainElements.length) {
				onMainElementChange(addedMainElements, removedMainElements);
				return;
			}

			onSecondaryElementChange(removedElements);
		}
	);

	const unobserve = () => {
		unobserveRO();
		unobserveIO();
		unobserveMO();
	};

	return unobserve;
};
