import { isEntryVisible } from "../shared/utils";
import {
	BewegungsOptions,
	CustomKeyframe,
	ElementReadouts,
	EntryType,
	GeneralState,
	MainElementState,
	ResultState,
	ResultTransferable,
} from "../types";
import { calculateEasingMap } from "./calculate-easings";
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

const getEasingMap = (mainElementState: MainElementState, generalState: GeneralState) => {
	const { options, totalRuntime } = mainElementState;
	const easingMap = new Map<string, Record<number, string>>();
	generalState.affectedBy.forEach((affectedBy, elementID) => {
		const easings = new Set<BewegungsOptions>(
			affectedBy.flatMap((mainElementID) => options.get(mainElementID) ?? [])
		);
		easingMap.set(elementID, calculateEasingMap([...easings], totalRuntime));
	});
	return easingMap;
};

export const deriveResultState = (
	mainElementState: MainElementState,
	generalState: GeneralState
): ResultState => {
	filterHiddenElements(mainElementState.readouts);
	overrideDisplayNone(mainElementState.readouts);

	const { appliableKeyframes, ...remainingMainState } = mainElementState;
	const { imageReadouts, defaultReadouts } = seperateReadouts(
		mainElementState.readouts,
		generalState.type
	);
	const easings = getEasingMap(mainElementState, generalState);

	return {
		overrides: new Map<string, CustomKeyframe>(),
		placeholders: new Map<string, string>(),
		wrappers: new Map<string, string>(),
		imageReadouts,
		defaultReadouts,
		easings,
		resultingStyle: structuredClone(appliableKeyframes.get(1)!),
		keyframes: new Map<string, Keyframe[]>(),
		...remainingMainState,
		...generalState,
	};
};

export const constructKeyframes = (resultState: ResultState): ResultTransferable => {
	const { resultingStyle, keyframes, overrides, totalRuntime, wrappers, placeholders } =
		resultState;

	getImageKeyframes(resultState);
	getDefaultKeyframes(resultState);

	return {
		resultingStyle,
		keyframes,
		overrides,
		totalRuntime,
		wrappers,
		placeholders,
	};
};