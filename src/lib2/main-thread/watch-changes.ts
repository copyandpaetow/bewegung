import { throttle } from "../shared/utils";
import { Deferred, MainState, ReactivityCallbacks } from "../types";
import { observerDimensions } from "./watch-dimensions";
import { observeMutations } from "./watch-mutations";
import { observeResizes } from "./watch-resizes";

export const removeElementsFromTranslation = (removedElements: HTMLElement[], state: MainState) =>
	removedElements.forEach((element) => state.translation.delete(element));

export const watchForChanges = (
	state: MainState,
	callbacks: ReactivityCallbacks,
	selectors: string[],
	done: Deferred
) => {
	const { resets } = state;
	const {
		onDimensionOrPositionChange,
		before,
		after,
		onMainElementChange,
		onSecondaryElementChange,
	} = callbacks;
	const throttledDimensionChange = throttle();
	const prefixedCallback = async (callback: VoidFunction) => {
		unobserve();
		before();
		callback();
		await done.promise;
		after();
	};

	const dimensionChange = () =>
		throttledDimensionChange.fn(async () => {
			prefixedCallback(onDimensionOrPositionChange);
		});
	const unobserveRO = observeResizes(dimensionChange, state);
	const unobserveIO = observerDimensions(dimensionChange, state);

	const unobserveMO = observeMutations(
		state,
		selectors,
		(addedElements: HTMLElement[], removedElements: HTMLElement[]) => {
			const mainElementAffected = [...addedElements, ...removedElements].some((element) => {
				if (resets.has(element)) {
					prefixedCallback(onMainElementChange);
				}
			});

			if (mainElementAffected) {
				return;
			}
			prefixedCallback(() => onSecondaryElementChange(removedElements));
		}
	);

	const unobserve = () => {
		throttledDimensionChange.clear();
		unobserveRO();
		unobserveIO();
		unobserveMO();
	};

	return unobserve;
};
