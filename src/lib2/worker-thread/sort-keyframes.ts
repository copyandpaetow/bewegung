import { DefaultKeyframes, ElementReadouts, ImageState, WorkerState } from "../types";
import { isEntryVisible } from "../utils";
import { getDefaultKeyframes } from "./create-default-keyframes";
import { getImageKeyframes } from "./create-image-keyframes";

const recalculateDisplayNoneValues = (readout: ElementReadouts[]): ElementReadouts[] => {
	if (readout.every(isEntryVisible)) {
		return readout;
	}

	return readout.map((entry, index, array) => {
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
			unsaveHeight: 0,
			unsaveWidth: 0,
			display: entry.display,
			offset: entry.offset,
		};
	});
};

export const constructKeyframes = (
	workerState: WorkerState
): [Map<string, ImageState>, Map<string, DefaultKeyframes>] => {
	const { readouts, lookup } = workerState;

	const imageReadouts = new Map<string, ImageState>();
	const defaultReadouts = new Map<string, DefaultKeyframes>();

	readouts.forEach((elementReadouts, elementString) => {
		const isImage = lookup.get(elementString)!.type === "image";
		const saveReadouts = recalculateDisplayNoneValues(elementReadouts);
		isImage
			? imageReadouts.set(
					elementString,
					getImageKeyframes(saveReadouts, elementString, workerState)
			  )
			: defaultReadouts.set(
					elementString,
					getDefaultKeyframes(saveReadouts, elementString, workerState)
			  );
	});

	imageReadouts.forEach((entry, elementString) => {
		if (new Set(entry.keyframes.map((frame) => frame.transform)).size > 1) {
			return;
		}

		imageReadouts.delete(elementString);
	});

	defaultReadouts.forEach((entry, elementString) => {
		if (new Set(entry.keyframes.map((frame) => frame.transform)).size > 1) {
			return;
		}

		defaultReadouts.delete(elementString);
	});

	return [imageReadouts, defaultReadouts];
};
