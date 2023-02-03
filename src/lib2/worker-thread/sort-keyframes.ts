import { isEntryVisible } from "../shared/utils";
import {
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	GeneralState,
	KeyframeState,
	MainElementState,
	ResultState,
	ResultTransferable,
} from "../types";
import { getDefaultKeyframes } from "./create-default-keyframes";
import { getImageKeyframes } from "./create-image-keyframes";

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
			unsaveHeight: 0,
			unsaveWidth: 0,
			display: entry.display,
			offset: entry.offset,
		};
	});

const doesElementChangeInScale = (readouts: ElementReadouts[]) =>
	readouts.some(
		(entry) =>
			entry.unsaveWidth !== readouts.at(-1)!.unsaveWidth ||
			entry.unsaveHeight !== readouts.at(-1)!.unsaveHeight
	);

const filterHiddenElements = (readouts: Map<string, ElementReadouts[]>) => {
	readouts.forEach((elementReadouts, elementID) => {
		if (elementReadouts.some(isEntryVisible)) {
			return;
		}
		readouts.delete(elementID);
	});
};

const overrideDisplayNone = (readouts: Map<string, ElementReadouts[]>) => {
	readouts.forEach((elementReadouts, elementID) => {
		if (elementReadouts.every(isEntryVisible)) {
			return;
		}
		readouts.set(elementID, recalculateDisplayNoneValues(elementReadouts));
	});
};

const seperateReadouts = (
	readouts: Map<string, ElementReadouts[]>,
	type: Map<string, EntryType>
) => {
	const imageReadouts = new Map<string, ElementReadouts[]>();
	const defaultReadouts = new Map<string, ElementReadouts[]>();

	readouts.forEach((elementReadouts, elementID) => {
		const isElementAnImage = type.get(elementID) === "image";
		if (isElementAnImage && doesElementChangeInScale(elementReadouts)) {
			imageReadouts.set(elementID, elementReadouts);
			return;
		}
		defaultReadouts.set(elementID, elementReadouts);
	});

	return { imageReadouts, defaultReadouts };
};

export const deriveResultState = (
	mainElementState: MainElementState,
	generalState: GeneralState,
	keyframeState: KeyframeState
): ResultState => {
	filterHiddenElements(keyframeState.readouts);
	overrideDisplayNone(keyframeState.readouts);

	const { appliableKeyframes, ...remainingMainState } = mainElementState;
	const { imageReadouts, defaultReadouts } = seperateReadouts(
		keyframeState.readouts,
		generalState.type
	);

	return {
		overrides: new Map<string, CustomKeyframe>(),
		placeholders: new Map<string, string>(),
		wrappers: new Map<string, string>(),
		imageReadouts,
		defaultReadouts,
		resultingStyle: structuredClone(appliableKeyframes.get(1)!),
		keyframes: new Map<string, Keyframe[]>(),
		...remainingMainState,
		...generalState,
	};
};

export const constructKeyframes = (resultState: ResultState): ResultTransferable => {
	const { resultingStyle, keyframes, overrides, totalRuntime, wrappers, placeholders } =
		resultState;

	getDefaultKeyframes(resultState);
	getImageKeyframes(resultState);

	return {
		resultingStyle,
		keyframes,
		overrides,
		totalRuntime,
		wrappers,
		placeholders,
	};
};
