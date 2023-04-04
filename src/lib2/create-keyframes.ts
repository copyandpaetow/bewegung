import { getDefaultKeyframes } from "./calculations/default-keyframes";
import { getImageKeyframes } from "./calculations/image-keyframes";
import { ElementReadouts, ResultTransferable, WorkerState } from "./types";

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

//TODO: if elements are added or removed they also would need overrides for the time being
const setOverridesForPartialElements = (state: WorkerState, elementsToBeRemoved: Set<string>) => {
	const { readouts, timings } = state;
	const amountOfReadouts = timings.length;

	readouts.forEach((elementReadouts, elementID) => {
		if (elementReadouts.length === amountOfReadouts) {
			return;
		}
		if (elementReadouts.at(0)!.offset !== timings.at(0)) {
			const firstAvailableTiming = timings.findIndex(
				(timing) => timing === elementReadouts.at(0)?.offset
			);
			const additionalEntries = timings.slice(0, firstAvailableTiming).map((timing) => ({
				...elementReadouts.at(0)!,
				offset: timing,
			}));
			elementReadouts.unshift(...additionalEntries);
		}

		if (elementReadouts.at(-1)!.offset !== timings.at(-1)) {
			const LastAvailableTiming = timings.findIndex(
				(timing) => timing === elementReadouts.at(-1)?.offset
			);
			const additionalEntries = timings.slice(LastAvailableTiming + 1).map((timing) => ({
				...elementReadouts.at(-1)!,
				offset: timing,
			}));
			elementReadouts.push(...additionalEntries);
			elementsToBeRemoved.add(elementID);
		}
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
	const { readouts, imageReadouts, defaultReadouts, ratios } = state;

	readouts.forEach((elementReadouts, elementID) => {
		const isElementAnImage = ratios.has(elementID);
		if (isElementAnImage && doesElementChangeInScale(elementReadouts)) {
			imageReadouts.set(elementID, elementReadouts);
			return;
		}
		defaultReadouts.set(elementID, elementReadouts);
	});
};

export const createKeyframes = (state: WorkerState): ResultTransferable => {
	const result: ResultTransferable = {
		overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
		overrideResets: new Map<string, Partial<CSSStyleDeclaration>>(),
		elementsToBeRemoved: new Set<string>(),
		placeholders: new Map<string, string>(),
		wrappers: new Map<string, string>(),
		keyframes: new Map<string, Keyframe[]>(),
	};

	filterCompletlyHiddenElements(state.readouts);
	setOverridesForPartialElements(state, result.elementsToBeRemoved);
	refillValuesFrompartiallyHiddenElements(state.readouts);

	seperateReadouts(state);
	getImageKeyframes(state, result);
	getDefaultKeyframes(state, result);

	return result;
};
