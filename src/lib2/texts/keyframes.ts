import { calculateStyleTables } from "../default/calculate-style-tables";
import { calculateDefaultKeyframes, filterDifferences, getNextParent } from "../default/keyframes";
import { setOverrides } from "../default/overrides";
import { refillPartialKeyframes } from "../default/refill-keyframes";
import {
	DefaultReadouts,
	DefaultTransferable,
	DifferenceArray,
	DimensionalDifferences,
	WorkerState,
} from "../types";
import { calculateTextDifferences } from "./calculate-differences";

const getTextDifferences = (
	textReadouts: Map<string, DefaultReadouts[]>,
	defaultReadouts: Map<string, DefaultReadouts[]>,
	parents: Map<string, string>
) => {
	const differenceMap = new Map<string, DimensionalDifferences[]>();

	//TODO: these can technically also be a root element

	textReadouts.forEach((elementReadouts, elementID) => {
		const parentKey = getNextParent(elementID, parents, textReadouts, defaultReadouts);
		const parentReadouts = textReadouts.get(parentKey) ?? defaultReadouts.get(parentKey)!;

		const differences = elementReadouts.map((currentReadout) => {
			const child: DifferenceArray = [currentReadout, elementReadouts.at(-1)!];
			const correspondingParentEntry = parentReadouts?.find(
				(entry) => entry.offset === currentReadout.offset
			)!;
			const parentReadout: DifferenceArray = [correspondingParentEntry, parentReadouts.at(-1)!];

			return calculateTextDifferences(child, parentReadout);
		});

		differenceMap.set(elementID, differences);
	});

	return differenceMap;
};

export const getTextKeyframes = (state: WorkerState): DefaultTransferable => {
	const { textReadouts, defaultReadouts, parents, timings } = state;
	const keyframes = new Map<string, Keyframe[]>();
	const partialElements = refillPartialKeyframes(textReadouts, timings);

	const differenceMap = filterDifferences(
		getTextDifferences(textReadouts, defaultReadouts, parents),
		defaultReadouts,
		parents
	);
	//TODO: it doesnt realy make sense to have this only for the default readouts. In general there are some properties we might want to animate as well
	const styleTableMap = calculateStyleTables(state);

	differenceMap.forEach((differences, elementID) => {
		const styleTables = styleTableMap.get(elementID)!;
		const keyframe = calculateDefaultKeyframes(differences, styleTables);

		if (partialElements.has(elementID)) {
			partialElements.set(elementID, keyframe);
			return;
		}

		keyframes.set(elementID, keyframe);
	});
	const overrides = setOverrides(defaultReadouts, partialElements, state);

	return {
		keyframes,
		partialElements,
		overrides,
	};
};
