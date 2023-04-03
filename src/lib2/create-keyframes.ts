import { calculateEasings } from "./calculations/easings";
import { calculateImageKeyframes } from "./calculations/image-keyframes";
import { AnimationTransferable, ElementReadouts, WorkerState } from "./types";

export const isEntryVisible = (entry: ElementReadouts) =>
	entry.display !== "none" && entry.display !== "" && entry.height !== 0 && entry.width !== 0;

const recalculateDisplayNoneValues = (readout: ElementReadouts[]): ElementReadouts[] =>
	readout.map((entry, index, array) => {
		if (isEntryVisible(entry)) {
			return entry;
		}
		const nextEntry =
			array.slice(0, index).reverse().find(isEntryVisible) ||
			array.slice(index).find(isEntryVisible);

		if (!nextEntry) {
			return entry;
		}

		return {
			...nextEntry,
			display: entry.display,
			offset: entry.offset,
		};
	});

const filterCompletlyHiddenElements = (readouts: Map<string, ElementReadouts[]>) => {
	readouts.forEach((elementReadouts, elementID) => {
		if (elementReadouts.some(isEntryVisible)) {
			return;
		}
		readouts.delete(elementID);
	});
};

const refillValuesFrompartiallyHiddenElements = (readouts: Map<string, ElementReadouts[]>) => {
	readouts.forEach((elementReadouts, elementID) => {
		if (elementReadouts.every(isEntryVisible)) {
			return;
		}
		readouts.set(elementID, recalculateDisplayNoneValues(elementReadouts));
	});
};

const doesElementChangeInScale = (readouts: ElementReadouts[]) =>
	readouts.some(
		(entry) => entry.width !== readouts.at(-1)!.width || entry.height !== readouts.at(-1)!.height
	);

const seperateReadouts = (state: WorkerState) => {
	const { dimensions, ratios } = state;
	const imageReadouts = new Map<string, ElementReadouts[]>();
	const defaultReadouts = new Map<string, ElementReadouts[]>();

	dimensions.forEach((elementReadouts, elementID) => {
		const isElementAnImage = ratios.has(elementID);
		if (isElementAnImage && doesElementChangeInScale(elementReadouts)) {
			imageReadouts.set(elementID, elementReadouts);
			return;
		}
		defaultReadouts.set(elementID, elementReadouts);
	});

	return { imageReadouts, defaultReadouts };
};

export const createKeyframes = (state: WorkerState): AnimationTransferable => {
	const keyframes = new Map<string, Keyframe>();

	filterCompletlyHiddenElements(state.dimensions);
	refillValuesFrompartiallyHiddenElements(state.dimensions);

	const { imageReadouts, defaultReadouts } = seperateReadouts(state);
	const imageKeyframes = calculateImageKeyframes(imageReadouts, state);

	//seperate images and defaults
	//calculate keyframes

	return { animations: keyframes };
};
